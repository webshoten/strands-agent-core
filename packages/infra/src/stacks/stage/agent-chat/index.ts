import { AgentChat } from "@infra/constructs/stage/agent-chat/index.ts";
import { publishAgentChatParameters } from "@infra/stacks/stage/agent-chat/parameters.ts";
import { CfnOutput, CfnParameter, Stack, type StackProps } from "aws-cdk-lib";
import type { Construct } from "constructs";

export type AgentChatStackProps = StackProps & {
  sharedEnv: string;
  stage: string;
};

/** Agent Chat Constructへ入力を渡し、実行時設定をSSMへ公開する。 */
export class AgentChatStack extends Stack {
  constructor(scope: Construct, id: string, props: AgentChatStackProps) {
    super(scope, id, props);

    const basicAuthValue = new CfnParameter(this, "BasicAuthValue", {
      description: "Complete HTTP Basic Authorization header value",
      noEcho: true,
      type: "String",
    });

    const agentChat = new AgentChat(this, "AgentChat", {
      awsRegion: this.region,
      basicAuthValue: basicAuthValue.valueAsString,
    });

    publishAgentChatParameters(this, {
      agentRuntimeArn: agentChat.agentRuntimeArn,
      awsRegion: this.region,
      eventApiHttpEndpoint: agentChat.eventApiHttpEndpoint,
      sharedEnv: props.sharedEnv,
      stage: props.stage,
      userPoolId: agentChat.userPoolId,
      webUrl: agentChat.webUrl,
      webUserPoolClientId: agentChat.webUserPoolClientId,
    });

    new CfnOutput(this, "WebUrl", { value: agentChat.webUrl });
    new CfnOutput(this, "EventApiHttpEndpoint", {
      value: agentChat.eventApiHttpEndpoint,
    });
    new CfnOutput(this, "AgentRuntimeArn", {
      value: agentChat.agentRuntimeArn,
    });
    new CfnOutput(this, "UserPoolId", {
      value: agentChat.userPoolId,
    });
    new CfnOutput(this, "WebUserPoolClientId", {
      value: agentChat.webUserPoolClientId,
    });
  }
}
