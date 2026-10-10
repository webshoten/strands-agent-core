import { createStringParameter } from "@infra/common/ssm.ts";
import type { Construct } from "constructs";

export type PublishAgentChatParametersInput = {
  agentRuntimeArn: string;
  awsRegion: string;
  eventApiHttpEndpoint: string;
  sharedEnv: string;
  stage: string;
  userPoolId: string;
  webUrl: string;
  webUserPoolClientId: string;
};

/** Agent Chatの実行時設定を格納するSSM階層を組み立てる。 */
export function buildAgentChatRuntimeParameterPrefix(
  sharedEnv: string,
  stage: string,
): string {
  return `/strands/shared/${sharedEnv}/stage/${stage}/runtime`;
}

/** Agent Chatの実行時設定をSSM Parameterへ公開する。 */
export function publishAgentChatParameters(
  scope: Construct,
  input: PublishAgentChatParametersInput,
): void {
  const prefix = buildAgentChatRuntimeParameterPrefix(
    input.sharedEnv,
    input.stage,
  );

  createStringParameter(scope, "AgentRuntimeArnParameter", {
    parameterName: `${prefix}/agentRuntimeArn`,
    stringValue: input.agentRuntimeArn,
  });
  createStringParameter(scope, "AwsRegionParameter", {
    parameterName: `${prefix}/awsRegion`,
    stringValue: input.awsRegion,
  });
  createStringParameter(scope, "EventApiHttpEndpointParameter", {
    parameterName: `${prefix}/eventApiHttpEndpoint`,
    stringValue: input.eventApiHttpEndpoint,
  });
  createStringParameter(scope, "UserPoolIdParameter", {
    parameterName: `${prefix}/userPoolId`,
    stringValue: input.userPoolId,
  });
  createStringParameter(scope, "WebUrlParameter", {
    parameterName: `${prefix}/webUrl`,
    stringValue: input.webUrl,
  });
  createStringParameter(scope, "WebUserPoolClientIdParameter", {
    parameterName: `${prefix}/webUserPoolClientId`,
    stringValue: input.webUserPoolClientId,
  });
}
