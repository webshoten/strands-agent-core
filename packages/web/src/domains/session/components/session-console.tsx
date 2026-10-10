import type { MessageEvent } from "@strands/shared";

type SessionConsoleProps = {
  completed: boolean;
  error: string | undefined;
  messages: MessageEvent[];
  sessionId: string | undefined;
};

/** セッションで受信したメッセージと実行状態を表示する。 */
export function SessionConsole({
  completed,
  error,
  messages,
  sessionId,
}: SessionConsoleProps) {
  return (
    <section className="console" aria-live="polite">
      <header className="console-header">
        <div>
          <span className="console-label">LIVE SESSION</span>
          <h2>{sessionId ?? "待機中"}</h2>
        </div>
        {sessionId ? (
          <span className={`run-state ${completed ? "complete" : "running"}`}>
            {completed ? "完了" : "実行中"}
          </span>
        ) : null}
      </header>

      <div className="event-list">
        {messages.length === 0 ? (
          <p className="empty-state">
            受信したメッセージがここに表示されます。
          </p>
        ) : null}
        {messages.map((message) => (
          <article
            className="event-card"
            key={`${message.sequence}-${message.timestamp}`}
          >
            <span className="sequence">
              {String(message.sequence).padStart(2, "0")}
            </span>
            <div>
              <p>{message.text}</p>
              <time dateTime={message.timestamp}>
                {new Date(message.timestamp).toLocaleTimeString("ja-JP")}
              </time>
            </div>
          </article>
        ))}
        {completed ? (
          <div className="completed-line">Session completed</div>
        ) : null}
        {error ? <div className="error-line">{error}</div> : null}
      </div>
    </section>
  );
}
