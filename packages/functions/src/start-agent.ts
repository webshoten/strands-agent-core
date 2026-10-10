import {
  BedrockAgentCoreClient,
  InvokeAgentRuntimeCommand,
} from "@aws-sdk/client-bedrock-agentcore";
import { isStartEvent, parseEventPayload } from "@strands/shared";

type IncomingEvent = {
  payload?: unknown;
};

type AppSyncEventContext = {
  events?: IncomingEvent[];
  info?: {
    channel?: {
      path?: string;
    };
  };
};

/**
 * AppSyncから呼ばれるLambda
 *
 * AgentCoreを呼び出す
 */
export async function handler(context: AppSyncEventContext): Promise<void> {
  const events = (context.events ?? [])
    .map((event) => parseEventPayload(event.payload))
    .filter(isStartEvent);

  const agentRuntimeArn = process.env.AGENT_RUNTIME_ARN;
  if (!agentRuntimeArn) {
    throw new Error("AGENT_RUNTIME_ARN is required");
  }

  const client = new BedrockAgentCoreClient({});
  const promises = events.map(async (event) => {
    const response = await client.send(
      new InvokeAgentRuntimeCommand({
        agentRuntimeArn,
        runtimeSessionId: event.sessionId,
        qualifier: "DEFAULT",
        contentType: "application/json",
        accept: "application/json",
        payload: new TextEncoder().encode(JSON.stringify(event)),
      }),
    );

    await response.response?.transformToByteArray();
  });

  await Promise.all(promises);
}
