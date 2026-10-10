import type { SessionEvent } from "@strands/shared";
import type { WebConfig } from "@/app/config.ts";

type SubscriptionMessage =
  | {
      id: string;
      type: "subscribe_success";
    }
  | {
      id: string;
      type: "subscribe_error";
      errors?: Array<{ message?: string }>;
    }
  | {
      id: string;
      type: "data";
      event?: string[];
    };

export type SessionSubscription = {
  ready: Promise<void>;
  unsubscribe: () => void;
};

/** セッションの出力チャネルを購読する。 */
export function createSessionSubscription(
  socket: WebSocket,
  config: WebConfig,
  sessionId: string,
  onEvent: (event: SessionEvent) => void,
): SessionSubscription {
  const subscriptionId = crypto.randomUUID();
  let resolveReady: () => void;
  let rejectReady: (error: Error) => void;

  const ready = new Promise<void>((resolve, reject) => {
    resolveReady = resolve;
    rejectReady = reject;
  });

  function unsubscribe() {
    socket.removeEventListener("message", handleMessage);

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "unsubscribe", id: subscriptionId }));
    }
  }

  function handleMessage(messageEvent: MessageEvent<string>) {
    const message = JSON.parse(messageEvent.data) as SubscriptionMessage;

    if (message.id !== subscriptionId) {
      return;
    }

    switch (message.type) {
      case "subscribe_success":
        resolveReady();
        break;

      case "subscribe_error": {
        socket.removeEventListener("message", handleMessage);
        const detail =
          message.errors?.[0]?.message ?? "AppSync subscription failed";
        rejectReady(new Error(detail));
        break;
      }

      case "data":
        for (const serializedEvent of message.event ?? []) {
          onEvent(JSON.parse(serializedEvent) as SessionEvent);
        }
        break;
    }
  }

  socket.addEventListener("message", handleMessage);
  socket.send(
    JSON.stringify({
      type: "subscribe",
      id: subscriptionId,
      channel: `/sessions/${sessionId}`,
      authorization: {
        authorization: config.lambdaAuthorizationToken,
      },
    }),
  );

  return { ready, unsubscribe };
}
