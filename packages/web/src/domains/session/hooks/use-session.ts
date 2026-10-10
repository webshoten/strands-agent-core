import type { MessageEvent, SessionEvent } from "@strands/shared";
import { useState } from "react";

type SessionStatus = "idle" | "running" | "completed" | "error";

/** 画面に表示するセッション状態を管理する。 */
export function useSession() {
  const [sessionId, setSessionId] = useState<string>();
  const [messages, setMessages] = useState<MessageEvent[]>([]);
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [error, setError] = useState<string>();

  function start(nextSessionId: string) {
    setSessionId(nextSessionId);
    setMessages([]);
    setStatus("running");
    setError(undefined);
  }

  function receiveEvent(event: SessionEvent) {
    if (event.type === "message") {
      setMessages((current) => [...current, event]);
      return;
    }

    setStatus("completed");
  }

  function fail(reason: unknown) {
    setStatus("error");
    setError(reason instanceof Error ? reason.message : String(reason));
  }

  return {
    completed: status === "completed",
    error,
    fail,
    messages,
    receiveEvent,
    sessionId,
    sessionRunning: status === "running",
    start,
  };
}
