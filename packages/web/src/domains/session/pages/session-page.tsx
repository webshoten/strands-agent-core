import { useConfig } from "@/app/contexts/config-context.tsx";
import { SessionConsole } from "@/domains/session/components/session-console.tsx";
import { SessionHeader } from "@/domains/session/components/session-header.tsx";
import { useSessionSubscription } from "@/domains/session/contexts/session-subscription-context.tsx";
import { useSession } from "@/domains/session/hooks/use-session.ts";
import { publishStartEvent } from "@/domains/session/services/start-event-publisher.ts";

/** 第1 MVPのセッション開始画面を表示する。 */
export function SessionPage() {
  const config = useConfig();
  const { subscribe, unsubscribe } = useSessionSubscription();

  const session = useSession();

  async function handleStart() {
    const sessionId = crypto.randomUUID();
    session.start(sessionId);

    try {
      await subscribe(sessionId, session.receiveEvent, session.fail);
      await publishStartEvent(config.startChannelNamespace, {
        type: "start",
        sessionId,
      });
    } catch (error) {
      unsubscribe();
      session.fail(error);
    }
  }

  return (
    <main className="page-shell">
      <SessionHeader
        sessionRunning={session.sessionRunning}
        onStart={() => void handleStart()}
      />
      <SessionConsole
        completed={session.completed}
        error={session.error}
        messages={session.messages}
        sessionId={session.sessionId}
      />
    </main>
  );
}
