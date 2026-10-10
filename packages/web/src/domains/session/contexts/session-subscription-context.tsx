import type { SessionEvent } from "@strands/shared";
import { type EventsChannel, events } from "aws-amplify/data";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";

type SubscriptionData = {
  event: SessionEvent;
};

type SessionSubscriptionContextValue = {
  subscribe: (
    sessionId: string,
    onEvent: (event: SessionEvent) => void,
    onError: (error: unknown) => void,
  ) => Promise<void>;
  unsubscribe: () => void;
};

const SessionSubscriptionContext = createContext<
  SessionSubscriptionContextValue | undefined
>(undefined);

/** 現在のセッション購読を所有する。 */
export function SessionSubscriptionProvider({ children }: PropsWithChildren) {
  const activeChannel = useRef<EventsChannel | undefined>(undefined);

  const unsubscribe = useCallback(() => {
    const channel = activeChannel.current;
    if (!channel) {
      return;
    }

    activeChannel.current = undefined;
    channel.close();
  }, []);

  async function subscribe(
    sessionId: string,
    onEvent: (event: SessionEvent) => void,
    onError: (error: unknown) => void,
  ) {
    unsubscribe();
    const channel = await events.connect(`/sessions/${sessionId}`);
    activeChannel.current = channel;

    const subscription = channel.subscribe({
      next: (data: SubscriptionData) => {
        onEvent(data.event);
      },
      error: onError,
    });

    try {
      await subscription.ready;
    } catch (error) {
      if (activeChannel.current === channel) {
        unsubscribe();
      }
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
