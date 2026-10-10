type AppSyncAuthorizerEvent = {
  authorizationToken?: string;
  requestHeaders?: Record<string, string | undefined>;
};

type AppSyncAuthorizerResult = {
  isAuthorized: boolean;
  ttlOverride: number;
};

/**
 * Lambda Authorizer
 *
 * CloudFrontが追加したオリジン確認ヘッダーを検証する。
 */
export async function handler(
  event: AppSyncAuthorizerEvent,
): Promise<AppSyncAuthorizerResult> {
  const expected = process.env.ORIGIN_VERIFY_VALUE;

  if (typeof expected !== "string") {
    throw new Error("ORIGIN_VERIFY_VALUE is required");
  }

  if (expected.length === 0) {
    throw new Error("ORIGIN_VERIFY_VALUE is empty");
  }

  let actualOriginVerifyValue: string | undefined;

  for (const [headerName, headerValue] of Object.entries(
    event.requestHeaders ?? {},
  )) {
    if (headerName.toLowerCase() === "x-origin-verify") {
      actualOriginVerifyValue = headerValue;
      break;
    }
  }

  return {
    isAuthorized: actualOriginVerifyValue === expected,
    ttlOverride: 0,
  };
}
