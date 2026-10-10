import type { App } from "aws-cdk-lib";

const safeSegmentPattern = /^[a-zA-Z0-9_-]{1,40}$/;

/** SSM階層で使用する共有環境名をCDK contextから取得する。 */
export function readSharedEnv(app: App): string {
  const sharedEnv = String(app.node.tryGetContext("shared-env") ?? "-");
  return normalizeSafeSegment(sharedEnv, "shared-env");
}

/** デプロイ対象のStage名をCDK contextから取得する。 */
export function readStage(app: App): string {
  const stage = String(app.node.tryGetContext("stage") ?? "");
  return normalizeSafeSegment(stage, "stage");
}

function normalizeSafeSegment(value: string, label: string): string {
  const normalized = value.trim();

  if (!safeSegmentPattern.test(normalized)) {
    throw new Error(`${label} must be 1-40 chars: a-z, A-Z, 0-9, _, -`);
  }

  return normalized;
}
