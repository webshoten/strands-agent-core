import assert from "node:assert/strict";
import test from "node:test";
import { buildAgentChatRuntimeParameterPrefix } from "../src/stacks/stage/agent-chat/parameters.ts";

test("Agent Chatの実行時設定用SSM階層を組み立てる", () => {
  const prefix = buildAgentChatRuntimeParameterPrefix("-", "dev");

  assert.equal(prefix, "/strands/shared/-/stage/dev/runtime");
});
