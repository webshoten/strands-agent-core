import type { SessionEvent } from "@strands/shared";
import type { WebConfig } from "@/app/config.ts";
import { publishStartEvent } from "@/domains/session/services/start-event-publisher.ts";

type StartAgentSessionInput = {
  config: WebConfig;
  onEvent: (event: SessionEvent) => void;
  sessionId: string;
  socket: WebSocket;
  subscribeToSession: (
    sessionId: string,
    onEvent: (event: SessionEvent) => void,
  ) => Promise<void>;
  unsubscribeFromSession: () => void;
};

/** 出力チャネルを購読してからAgentCoreの開始イベントを送信する。 */
export async function startAgentSession(
  input: StartAgentSessionInput,
): Promise<void> {
  // AgentCoreの出力を受け取れる状態になるまで待つ。
  await input.subscribeToSession(input.sessionId, input.onEvent);

  try {
    // 購読完了後にAgentCoreの開始イベントを送る。
    await publishStartEvent(input.socket, input.config, {
      type: "start",
      sessionId: input.sessionId,
    });
  } catch (error) {
    // 開始できなかったセッションの購読を残さない。
    input.unsubscribeFromSession();
    throw error;
  }
}
