import type { StartEvent } from "@strands/shared";

/** ローカルAgentCore互換サーバーへセッション開始要求を送る。 */
export async function startLocalAgent(
  endpoint: string,
  event: StartEvent,
): Promise<void> {
  const response = await fetch(endpoint, {
    body: JSON.stringify(event),
    headers: { "content-type": "application/json" },
    method: "POST",
  });
  const responseBody = await response.text();

  if (!response.ok) {
    throw new Error(`Local Agent returned ${response.status}: ${responseBody}`);
  }
}
