export type StartBridgeConfig = {
  agentEndpoint: string;
  awsRegion: string;
  eventApiHttpEndpoint: string;
  startChannel: string;
};

/** ローカル開始ブリッジの接続先を環境変数から読み取る。 */
export function loadConfig(): StartBridgeConfig {
  return {
    agentEndpoint:
      process.env.LOCAL_AGENT_ENDPOINT ?? "http://127.0.0.1:8080/invocations",
    awsRegion: readRequiredEnv("AWS_REGION"),
    eventApiHttpEndpoint: readRequiredEnv("APPSYNC_HTTP_ENDPOINT"),
    startChannel: "/local-commands/*",
  };
}

function readRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}
