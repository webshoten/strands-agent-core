import type { ConnectionState } from "@/domains/session/services/appsync-events-connection.ts";

const connectionLabels: Record<ConnectionState, string> = {
  connected: "接続済み",
  connecting: "接続中",
  disconnected: "未接続",
  error: "接続エラー",
};

type SessionHeaderProps = {
  connectionState: ConnectionState;
  sessionRunning: boolean;
  onStart: () => void;
};

/** セッションの接続状態と開始操作を表示する。 */
export function SessionHeader({
  connectionState,
  sessionRunning,
  onStart,
}: SessionHeaderProps) {
  return (
    <section className="hero">
      <div className="eyebrow">AWS END-TO-END / MVP 01</div>
      <h1>Strands AgentCore</h1>
      <p className="lead">
        ブラウザからAgentCoreを起動し、AppSync Eventsで出力を受け取ります。
      </p>

      <div className="status-row">
        <span className={`status-dot ${connectionState}`} aria-hidden="true" />
        <span>{connectionLabels[connectionState]}</span>
      </div>

      <button
        className="start-button"
        type="button"
        disabled={connectionState !== "connected" || sessionRunning}
        onClick={onStart}
      >
        セッションを開始
      </button>
    </section>
  );
}
