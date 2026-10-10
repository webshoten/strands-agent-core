import assert from "node:assert/strict";
import test from "node:test";
import { handler } from "../src/authorizer.ts";

test("CloudFrontの確認ヘッダーが一致した場合だけ許可する", async () => {
  process.env.ORIGIN_VERIFY_VALUE = "expected";

  assert.deepEqual(
    await handler({ requestHeaders: { "X-Origin-Verify": "expected" } }),
    { isAuthorized: true, ttlOverride: 0 },
  );
  assert.deepEqual(
    await handler({ requestHeaders: { "x-origin-verify": "different" } }),
    { isAuthorized: false, ttlOverride: 0 },
  );
});
