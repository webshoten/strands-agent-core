import { useAppSyncEvents } from "@/app/contexts/appsync-events-context.tsx";
import { SessionConsole } from "@/domains/session/components/session-console.tsx";
import { SessionHeader } from "@/domains/session/components/session-header.tsx";
import { useSession } from "@/domains/session/contexts/session-context.tsx";

/** 第1 MVPのセッション開始画面を表示する。 */
export function SessionPage() {
  const { connectionState, error: connectionError } = useAppSyncEvents();

  const {
    completed,
    error: sessionError,
    messages,
    sessionId,
    sessionRunning,
    startSession,
  } = useSession();

  const error = sessionError ?? connectionError;

  return (
    <main className="page-shell">
      <SessionHeader
        connectionState={connectionState}
        sessionRunning={sessionRunning}
        onStart={() => void startSession()}
      />
      <SessionConsole
        completed={completed}
        error={error}
        messages={messages}
        sessionId={sessionId}
      />
    </main>
  );
}
