import type { StartEvent } from "@strands/shared";
import type { WebConfig } from "@/app/config.ts";

type PublishResponse = {
  id?: string;
  type?: string;
  errors?: Array<{ message?: string }>;
};

/** セッション開始イベントをコマンドチャネルへ送る。 */
export function publishStartEvent(
  socket: WebSocket,
  config: WebConfig,
  event: StartEvent,
): Promise<void> {
  const operationId = crypto.randomUUID();

  const eventPublished = new Promise<void>((resolve, reject) => {
    function cleanup() {
      socket.removeEventListener("message", handleMessage);
    }

    function handleMessage(messageEvent: MessageEvent<string>) {
      const message = JSON.parse(messageEvent.data) as PublishResponse;

      if (message.id !== operationId) {
        return;
      }

      if (message.type === "publish_success") {
        cleanup();
        resolve();
        return;
      }

      if (message.type === "publish_error") {
        cleanup();
        const detail = message.errors?.[0]?.message ?? "AppSync publish failed";
        reject(new Error(detail));
      }
    }

    socket.addEventListener("message", handleMessage);
    socket.send(
      JSON.stringify({
        type: "publish",
        id: operationId,
        channel: `/commands/${event.sessionId}`,
        events: [JSON.stringify(event)],
        authorization: {
          authorization: config.lambdaAuthorizationToken,
        },
      }),
    );
  });

  return eventPublished;
}
