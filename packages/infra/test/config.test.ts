import assert from "node:assert/strict";
import test from "node:test";
import { buildWebConfigContent } from "../src/constructs/stage/agent-chat/web/config.ts";

test("Reactの実行時設定をconfig.jsとして生成する", () => {
  const content = buildWebConfigContent({
    awsRegion: "ap-northeast-1",
    eventApiHttpEndpoint:
      "https://example.appsync-api.ap-northeast-1.amazonaws.com/event",
    userPoolId: "ap-northeast-1_example",
    webUserPoolClientId: "web-client-id",
  });

  assert.match(content, /^window\.__STRANDS_CONFIG__=/);
  assert.match(content, /ap-northeast-1_example/);
  assert.match(content, /appsync-api/);
});
