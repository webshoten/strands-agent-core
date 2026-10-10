import { useAppSyncConnection } from "@/app/contexts/appsync-connection-context.tsx";
import { useConfig } from "@/app/contexts/config-context.tsx";
import { SessionConsole } from "@/domains/session/components/session-console.tsx";
import { SessionHeader } from "@/domains/session/components/session-header.tsx";
import { useSessionSubscription } from "@/domains/session/contexts/session-subscription-context.tsx";
import { useSession } from "@/domains/session/hooks/use-session.ts";
import { publishStartEvent } from "@/domains/session/services/start-event-publisher.ts";

/** 第1 MVPのセッション開始画面を表示する。 */
export function SessionPage() {
  const config = useConfig();

  const {
    connectionState,
    error: connectionError,
    socket,
  } = useAppSyncConnection();

  const { subscribe, unsubscribe } = useSessionSubscription();

  const session = useSession();

  async function handleStart() {
    if (!socket) {
      session.fail("AppSync Events is not connected");
      return;
    }

    const sessionId = crypto.randomUUID();
    session.start(sessionId);

    try {
      await subscribe(sessionId, session.receiveEvent);
      await publishStartEvent(socket, config, { type: "start", sessionId });
    } catch (error) {
      unsubscribe();
      session.fail(error);
    }
  }

  const error = session.error ?? connectionError;

  return (
    <main className="page-shell">
      <SessionHeader
        connectionState={connectionState}
        sessionRunning={session.sessionRunning}
        onStart={() => void handleStart()}
      />
      <SessionConsole
        completed={session.completed}
        error={error}
        messages={session.messages}
        sessionId={session.sessionId}
      />
    </main>
  );
}
