import type { StartEvent } from "@strands/shared";
import { events } from "aws-amplify/data";

/** セッション開始イベントをコマンドチャネルへ送る。 */
export async function publishStartEvent(
  channelNamespace: string,
  event: StartEvent,
): Promise<void> {
  const channel = `/${channelNamespace}/${event.sessionId}`;
  await events.post(channel, event);
}
