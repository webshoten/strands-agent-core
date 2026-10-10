import { AgentCoreRuntime } from "@infra/constructs/stage/agent-chat/agentcore.ts";
import { Auth } from "@infra/constructs/stage/agent-chat/auth.ts";
import { Realtime } from "@infra/constructs/stage/agent-chat/realtime.ts";
import { Web } from "@infra/constructs/stage/agent-chat/web/index.ts";
import { Construct } from "constructs";

export type AgentChatProps = {
  awsRegion: string;
  basicAuthValue: string;
};

/** Agent Chatを構成する認証、リアルタイム通信、実行環境、Web配信を接続する。 */
export class AgentChat extends Construct {
  readonly agentRuntimeArn: string;
  readonly eventApiHttpEndpoint: string;
  readonly userPoolId: string;
  readonly webUrl: string;
  readonly webUserPoolClientId: string;

  constructor(scope: Construct, id: string, props: AgentChatProps) {
    super(scope, id);

    const auth = new Auth(this, "Auth");

    const realtime = new Realtime(this, "Realtime", {
      userPool: auth.userPool,
    });

    const agentRuntime = new AgentCoreRuntime(this, "AgentCore", {
      appSyncHttpHost: realtime.eventApi.httpDns,
    });
    realtime.connectAgentRuntime(agentRuntime);

    const eventApiHttpEndpoint = `https://${realtime.eventApi.httpDns}/event`;
    const web = new Web(this, "Web", {
      awsRegion: props.awsRegion,
      basicAuthValue: props.basicAuthValue,
      eventApiHttpEndpoint,
      userPoolId: auth.userPool.userPoolId,
      webUserPoolClientId: auth.webUserPoolClient.userPoolClientId,
    });

    this.agentRuntimeArn = agentRuntime.agentRuntimeArn;
    this.eventApiHttpEndpoint = eventApiHttpEndpoint;
    this.userPoolId = auth.userPool.userPoolId;
    this.webUrl = web.url;
    this.webUserPoolClientId = auth.webUserPoolClient.userPoolClientId;
  }
}
