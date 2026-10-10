import { describe, expect, it } from "vitest";
import { encodeBase64Url } from "./base64-url.ts";

describe("encodeBase64Url", () => {
  it("AppSyncのWebSocketサブプロトコル用にJSONを符号化する", () => {
    expect(encodeBase64Url('{"value":"日本語"}')).not.toMatch(/[+/=]/);
  });
});
