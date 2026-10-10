import type { SessionEvent } from "@strands/shared";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { useAppSyncConnection } from "@/app/contexts/appsync-connection-context.tsx";
import { useConfig } from "@/app/contexts/config-context.tsx";

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

type ActiveSubscription = {
  id: string;
  messageHandler: (event: MessageEvent<string>) => void;
  socket: WebSocket;
};

type SessionSubscriptionContextValue = {
  subscribe: (
    sessionId: string,
    onEvent: (event: SessionEvent) => void,
  ) => Promise<void>;
  unsubscribe: () => void;
};

const SessionSubscriptionContext = createContext<
  SessionSubscriptionContextValue | undefined
>(undefined);

/** 現在のセッション購読を所有する。 */
export function SessionSubscriptionProvider({ children }: PropsWithChildren) {
  const config = useConfig();
  const { socket } = useAppSyncConnection();
  const activeSubscription = useRef<ActiveSubscription | undefined>(undefined);

  const unsubscribe = useCallback(() => {
    const subscription = activeSubscription.current;
    if (!subscription) {
      return;
    }

    subscription.socket.removeEventListener(
      "message",
      subscription.messageHandler,
    );

    if (subscription.socket.readyState === WebSocket.OPEN) {
      subscription.socket.send(
        JSON.stringify({ type: "unsubscribe", id: subscription.id }),
      );
    }

    activeSubscription.current = undefined;
  }, []);

  async function subscribe(
    sessionId: string,
    onEvent: (event: SessionEvent) => void,
  ) {
    if (!socket) {
      throw new Error("AppSync Events is not connected");
    }
    const connectedSocket = socket;

    unsubscribe();
    const subscriptionId = crypto.randomUUID();

    const subscriptionReady = new Promise<void>((resolve, reject) => {
      function handleMessage(messageEvent: MessageEvent<string>) {
        const message = JSON.parse(messageEvent.data) as SubscriptionMessage;

        if (message.id !== subscriptionId) {
          return;
        }

        switch (message.type) {
          case "subscribe_success":
            resolve();
            break;

          case "subscribe_error": {
            connectedSocket.removeEventListener("message", handleMessage);
            const detail =
              message.errors?.[0]?.message ?? "AppSync subscription failed";
            reject(new Error(detail));
            break;
          }

          case "data":
            for (const serializedEvent of message.event ?? []) {
              onEvent(JSON.parse(serializedEvent) as SessionEvent);
            }
            break;
        }
      }

      activeSubscription.current = {
        id: subscriptionId,
        messageHandler: handleMessage,
        socket: connectedSocket,
      };

      connectedSocket.addEventListener("message", handleMessage);
      connectedSocket.send(
        JSON.stringify({
          type: "subscribe",
          id: subscriptionId,
          channel: `/sessions/${sessionId}`,
          authorization: {
            authorization: config.lambdaAuthorizationToken,
          },
        }),
      );
    });

    try {
      await subscriptionReady;
    } catch (error) {
      unsubscribe();
      throw error;
    }
  }

  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  return (
    <SessionSubscriptionContext.Provider value={{ subscribe, unsubscribe }}>
      {children}
    </SessionSubscriptionContext.Provider>
  );
}

/** セッション購読の操作を取得する。 */
export function useSessionSubscription(): SessionSubscriptionContextValue {
  const context = useContext(SessionSubscriptionContext);
  if (!context) {
    throw new Error("SessionSubscriptionProvider is required");
  }
  return context;
}
