type SessionHeaderProps = {
  sessionRunning: boolean;
  onStart: () => void;
};

/** セッションの開始操作を表示する。 */
export function SessionHeader({ sessionRunning, onStart }: SessionHeaderProps) {
  return (
    <section className="hero">
      <div className="eyebrow">AWS END-TO-END / MVP 01</div>
      <h1>Strands AgentCore</h1>
      <p className="lead">
        ブラウザからAgentCoreを起動し、AppSync Eventsで出力を受け取ります。
      </p>

      <button
        className="start-button"
        type="button"
        disabled={sessionRunning}
        onClick={onStart}
      >
        セッションを開始
      </button>
    </section>
  );
}
