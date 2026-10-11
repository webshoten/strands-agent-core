import { subscribeToStartEvents } from "./appsync-events-subscriber.ts";
import { loadConfig } from "./config.ts";
import { startLocalAgent } from "./local-agent-client.ts";

async function main(): Promise<void> {
  const config = loadConfig();
  const socket = await subscribeToStartEvents(
    config.eventApiHttpEndpoint,
    config.awsRegion,
    config.startChannel,
    async (event) => {
      console.log(`Start event received: sessionId=${event.sessionId}`);
      await startLocalAgent(config.agentEndpoint, event);
      console.log(`Local Agent accepted: sessionId=${event.sessionId}`);
    },
  );

  console.log(`Start Bridge connected: ${config.startChannel}`);

  socket.addEventListener("close", (event) => {
    console.error(
      `Start Bridge disconnected: code=${event.code} reason=${event.reason}`,
    );
    process.exitCode = 1;
  });

  process.once("SIGINT", () => socket.close());
  process.once("SIGTERM", () => socket.close());
}

main().catch((error: unknown) => {
  console.error("Start Bridge failed");
  console.error(error);
  process.exitCode = 1;
});
