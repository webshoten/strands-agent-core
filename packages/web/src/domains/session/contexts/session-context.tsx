import type { MessageEvent, SessionEvent } from "@strands/shared";
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useState,
} from "react";
import { useAppSyncEvents } from "@/app/contexts/appsync-events-context.tsx";
import { useConfig } from "@/app/contexts/config-context.tsx";
import { useSessionSubscription } from "@/domains/session/contexts/session-subscription-context.tsx";
import { startAgentSession } from "@/domains/session/services/start-agent-session.ts";

type SessionStatus = "idle" | "running" | "completed" | "error";

type SessionContextValue = {
  completed: boolean;
  error: string | undefined;
  messages: MessageEvent[];
  sessionId: string | undefined;
  sessionRunning: boolean;
  startSession: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | undefined>(
  undefined,
);

/** セッションの表示状態と開始処理を子画面へ提供する。 */
export function SessionProvider({ children }: PropsWithChildren) {
  const config = useConfig();
  const { socket } = useAppSyncEvents();
  const { subscribeToSession, unsubscribeFromSession } =
    useSessionSubscription();

  const [sessionId, setSessionId] = useState<string>();
  const [messages, setMessages] = useState<MessageEvent[]>([]);
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [error, setError] = useState<string>();

  function receiveEvent(event: SessionEvent) {
    if (event.type === "message") {
      setMessages((current) => [...current, event]);
      return;
    }

    setStatus("completed");
  }

  async function startSession(): Promise<void> {
    if (!socket) {
      setError("AppSync Events is not connected");
      return;
    }

    const nextSessionId = crypto.randomUUID();
    setSessionId(nextSessionId);
    setMessages([]);
    setStatus("running");
    setError(undefined);

    try {
      await startAgentSession({
        socket,
        config,
        sessionId: nextSessionId,
        onEvent: receiveEvent,
        subscribeToSession,
        unsubscribeFromSession,
      });
    } catch (reason) {
      setStatus("error");
      setError(reason instanceof Error ? reason.message : String(reason));
    }
  }

  return (
    <SessionContext.Provider
      value={{
        completed: status === "completed",
        error,
        messages,
        sessionId,
        sessionRunning: status === "running",
        startSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

/** 現在のセッション状態と操作を取得する。 */
export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("SessionProvider is required");
  }
  return context;
}
