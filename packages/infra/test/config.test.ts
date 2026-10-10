import assert from "node:assert/strict";
import test from "node:test";
import { buildWebConfigContent } from "../src/constructs/stage/web/config.ts";

test("Reactの実行時設定をconfig.jsとして生成する", () => {
  const content = buildWebConfigContent({
    appSyncHttpHost: "example.appsync-api.ap-northeast-1.amazonaws.com",
    appSyncRealtimePath: "/event/realtime",
    lambdaAuthorizationToken: "mvp1",
  });

  assert.match(content, /^window\.__STRANDS_CONFIG__=/);
  assert.match(content, /event\/realtime/);
});
