import type { StartEvent } from "@strands/shared";
import { events } from "aws-amplify/data";

/** セッション開始イベントをコマンドチャネルへ送る。 */
export async function publishStartEvent(event: StartEvent): Promise<void> {
  await events.post(`/commands/${event.sessionId}`, event);
}
