import type { SessionEvent } from "@strands/shared";
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useRef,
} from "react";
import { useAppSyncEvents } from "@/app/contexts/appsync-events-context.tsx";
import { useConfig } from "@/app/contexts/config-context.tsx";
import {
  createSessionSubscription,
  type SessionSubscription,
} from "@/domains/session/services/session-events-subscription.ts";

type SessionSubscriptionContextValue = {
  subscribeToSession: (
    sessionId: string,
    onEvent: (event: SessionEvent) => void,
  ) => Promise<void>;
  unsubscribeFromSession: () => void;
};

const SessionSubscriptionContext = createContext<
  SessionSubscriptionContextValue | undefined
>(undefined);

/** 現在のセッション購読を所有する。 */
export function SessionSubscriptionProvider({ children }: PropsWithChildren) {
  const config = useConfig();
  const { socket } = useAppSyncEvents();
  const activeSubscription = useRef<SessionSubscription | undefined>(undefined);

  function unsubscribeFromSession() {
    activeSubscription.current?.unsubscribe();
    activeSubscription.current = undefined;
  }

  async function subscribeToSession(
    sessionId: string,
    onEvent: (event: SessionEvent) => void,
  ) {
    if (!socket) {
      throw new Error("AppSync Events is not connected");
    }

    unsubscribeFromSession();
    const subscription = createSessionSubscription(
      socket,
      config,
      sessionId,
      onEvent,
    );
    activeSubscription.current = subscription;

    try {
      await subscription.ready;
    } catch (error) {
      activeSubscription.current = undefined;
      throw error;
    }
  }

  useEffect(() => {
    return () => {
      activeSubscription.current?.unsubscribe();
    };
  }, []);

  return (
    <SessionSubscriptionContext.Provider
      value={{ subscribeToSession, unsubscribeFromSession }}
    >
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
