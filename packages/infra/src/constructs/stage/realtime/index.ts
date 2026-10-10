import type { AgentCoreRuntime } from "@infra/constructs/stage/agentcore/index.ts";
import {
  createAuthorizerFunction,
  createStartAgentFunction,
} from "@infra/constructs/stage/functions/index.ts";
import { Duration } from "aws-cdk-lib";
import * as appsync from "aws-cdk-lib/aws-appsync";
import { Construct } from "constructs";

export type RealtimeProps = {
  originVerifyValue: string;
};

/** AppSync Events、Lambda Authorizer、開始Lambda、チャネルを接続する。 */
export class Realtime extends Construct {
  readonly eventApi: appsync.EventApi;

  constructor(scope: Construct, id: string, props: RealtimeProps) {
    super(scope, id);

    const authorizer = createAuthorizerFunction(this, {
      originVerifyValue: props.originVerifyValue,
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
          { authorizationType: appsync.AppSyncAuthorizationType.IAM },
        ],
        connectionAuthModeTypes: [appsync.AppSyncAuthorizationType.LAMBDA],
        defaultPublishAuthModeTypes: [
          appsync.AppSyncAuthorizationType.LAMBDA,
          appsync.AppSyncAuthorizationType.IAM,
        ],
        defaultSubscribeAuthModeTypes: [
          appsync.AppSyncAuthorizationType.LAMBDA,
        ],
      },
    });

    this.eventApi = eventApi;
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
        publishAuthModeTypes: [appsync.AppSyncAuthorizationType.LAMBDA],
        subscribeAuthModeTypes: [appsync.AppSyncAuthorizationType.LAMBDA],
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
          subscribeAuthModeTypes: [appsync.AppSyncAuthorizationType.LAMBDA],
        },
        channelNamespaceName: "sessions",
      },
    );
    sessionsNamespace.grantPublish(agentRuntime);
  }
}
