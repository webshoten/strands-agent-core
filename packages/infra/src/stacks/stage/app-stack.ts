import { AgentCoreRuntime } from "@infra/constructs/stage/agentcore/index.ts";
import { Realtime } from "@infra/constructs/stage/realtime/index.ts";
import { Web } from "@infra/constructs/stage/web/index.ts";
import { CfnOutput, CfnParameter, Stack, type StackProps } from "aws-cdk-lib";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import type { Construct } from "constructs";

/** 第1 MVPのAWSリソース一式を構築するStack。 */
export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const basicAuthValue = new CfnParameter(this, "BasicAuthValue", {
      description: "Complete HTTP Basic Authorization header value",
      noEcho: true,
      type: "String",
    });
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

    const realtime = new Realtime(this, "Realtime", {
      originVerifyValue,
    });
    const agentRuntime = new AgentCoreRuntime(this, "AgentCore", {
      appSyncHttpHost: realtime.eventApi.httpDns,
    });
    realtime.connectAgentRuntime(agentRuntime);

    const web = new Web(this, "Web", {
      appSyncHttpHost: realtime.eventApi.httpDns,
      appSyncRealtimeDns: realtime.eventApi.realtimeDns,
      basicAuthValue: basicAuthValue.valueAsString,
      originVerifyValue,
    });

    new CfnOutput(this, "WebUrl", { value: web.url });
    new CfnOutput(this, "EventApiHttpEndpoint", {
      value: `https://${realtime.eventApi.httpDns}/event`,
    });
    new CfnOutput(this, "AgentRuntimeArn", {
      value: agentRuntime.agentRuntimeArn,
    });
  }
}
