import type { AgentCoreRuntime } from "@infra/constructs/stage/agent-chat/agentcore.ts";
import {
  createAuthorizerFunction,
  createStartAgentFunction,
} from "@infra/constructs/stage/agent-chat/functions.ts";
import { Duration } from "aws-cdk-lib";
import * as appsync from "aws-cdk-lib/aws-appsync";
import type * as cognito from "aws-cdk-lib/aws-cognito";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";

export type RealtimeProps = {
  userPool: cognito.IUserPool;
};

/** AppSync Eventsの認証、開始Lambda、AgentCore向けチャネルを構成する。 */
export class Realtime extends Construct {
  readonly eventApi: appsync.EventApi;
  readonly originVerifyValue: string;

  constructor(scope: Construct, id: string, props: RealtimeProps) {
    super(scope, id);

    const originVerifySecret = new secretsmanager.Secret(
      this,
      "OriginVerifySecret",
      {
        description: "CloudFront to AppSync origin verification value",
        generateSecretString: {
          excludePunctuation: true,
          passwordLength: 48,
        },
      },
    );
    const originVerifyValue = originVerifySecret.secretValue.unsafeUnwrap();
    const authorizer = createAuthorizerFunction(this, {
      originVerifyValue,
    });
    const eventApi = new appsync.EventApi(this, "EventApi", {
      apiName: "strands-agentcore-mvp",
      authorizationConfig: {
        authProviders: [
          {
            authorizationType: appsync.AppSyncAuthorizationType.LAMBDA,
            lambdaAuthorizerConfig: {
              handler: authorizer,
              resultsCacheTtl: Duration.seconds(0),
            },
          },
          {
            authorizationType: appsync.AppSyncAuthorizationType.USER_POOL,
            cognitoConfig: {
              userPool: props.userPool,
            },
          },
          { authorizationType: appsync.AppSyncAuthorizationType.IAM },
        ],
        connectionAuthModeTypes: [
          appsync.AppSyncAuthorizationType.LAMBDA,
          appsync.AppSyncAuthorizationType.USER_POOL,
        ],
        defaultPublishAuthModeTypes: [
          appsync.AppSyncAuthorizationType.LAMBDA,
          appsync.AppSyncAuthorizationType.USER_POOL,
          appsync.AppSyncAuthorizationType.IAM,
        ],
        defaultSubscribeAuthModeTypes: [
          appsync.AppSyncAuthorizationType.LAMBDA,
          appsync.AppSyncAuthorizationType.USER_POOL,
        ],
      },
    });

    this.eventApi = eventApi;
    this.originVerifyValue = originVerifyValue;
  }

  /** 開始LambdaとチャネルをAgentCore Runtimeへ接続する。 */
  connectAgentRuntime(agentRuntime: AgentCoreRuntime): void {
    const startAgent = createStartAgentFunction(this, {
      agentRuntimeArn: agentRuntime.agentRuntimeArn,
    });
    agentRuntime.grantInvokeRuntime(startAgent);

    const startDataSource = this.eventApi.addLambdaDataSource(
      "StartAgentDataSource",
      startAgent,
    );
    this.eventApi.addChannelNamespace("CommandsNamespace", {
      authorizationConfig: {
        publishAuthModeTypes: [
          appsync.AppSyncAuthorizationType.LAMBDA,
          appsync.AppSyncAuthorizationType.USER_POOL,
        ],
        subscribeAuthModeTypes: [
          appsync.AppSyncAuthorizationType.LAMBDA,
          appsync.AppSyncAuthorizationType.USER_POOL,
        ],
      },
      channelNamespaceName: "commands",
      publishHandlerConfig: {
        dataSource: startDataSource,
        direct: true,
        lambdaInvokeType: appsync.LambdaInvokeType.EVENT,
      },
    });
    const sessionsNamespace = this.eventApi.addChannelNamespace(
      "SessionsNamespace",
      {
        authorizationConfig: {
          publishAuthModeTypes: [appsync.AppSyncAuthorizationType.IAM],
          subscribeAuthModeTypes: [
            appsync.AppSyncAuthorizationType.LAMBDA,
            appsync.AppSyncAuthorizationType.USER_POOL,
          ],
        },
        channelNamespaceName: "sessions",
      },
    );
    sessionsNamespace.grantPublish(agentRuntime);
  }
}
