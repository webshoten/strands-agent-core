import assert from "node:assert/strict";
import test from "node:test";
import {
  BedrockAgentCoreClient,
  type InvokeAgentRuntimeCommand,
} from "@aws-sdk/client-bedrock-agentcore";
import { handler } from "../src/start-agent.ts";

test("有効な開始イベントごとにAgentCore Runtimeを呼び出す", async (t) => {
  const previousAgentRuntimeArn = process.env.AGENT_RUNTIME_ARN;
  process.env.AGENT_RUNTIME_ARN =
    "arn:aws:bedrock-agentcore:ap-northeast-1:123456789012:runtime/test";
  t.after(() => {
    if (previousAgentRuntimeArn === undefined) {
      delete process.env.AGENT_RUNTIME_ARN;
      return;
    }
    process.env.AGENT_RUNTIME_ARN = previousAgentRuntimeArn;
  });

  const sessionIds: string[] = [];
  t.mock.method(
    BedrockAgentCoreClient.prototype,
    "send",
    async (command: unknown) => {
      const sessionId = (command as InvokeAgentRuntimeCommand).input
        .runtimeSessionId;
      assert.ok(sessionId);
      sessionIds.push(sessionId);
      return {
        response: {
          transformToByteArray: async () => new Uint8Array(),
        },
      } as never;
    },
  );

  await handler({
    events: [
      { payload: JSON.stringify({ type: "start", sessionId: "session-1" }) },
      { payload: { type: "ignored" } },
      { payload: { type: "start", sessionId: "session-2" } },
    ],
  });

  assert.deepEqual(sessionIds.sort(), ["session-1", "session-2"]);
});
