import {
  isStartEvent,
  parseEventPayload,
  type StartEvent,
} from "@strands/shared";
import { AppSyncIamSigner } from "./appsync-iam-signer.ts";

type AppSyncMessage = {
  errors?: Array<{ message?: string }>;
  event?: string | string[];
  id?: string;
  type?: string;
};

type StartEventHandler = (event: StartEvent) => Promise<void>;

/** AppSync Eventsへ接続し、ローカル開始チャネルを購読する。 */
export async function subscribeToStartEvents(
  httpEndpoint: string,
  region: string,
  channel: string,
  onStartEvent: StartEventHandler,
): Promise<WebSocket> {
  const signer = new AppSyncIamSigner(httpEndpoint, region);
  const protocols = await signer.createConnectionProtocols();
  const socket = new WebSocket(signer.realtimeEndpoint, protocols);

  await waitForOpen(socket);

  const connectionAcknowledged = waitForMessage(
    socket,
    (message) => message.type === "connection_ack",
  );
  socket.send(JSON.stringify({ type: "connection_init" }));
  await connectionAcknowledged;

  const subscriptionId = crypto.randomUUID();
  const subscriptionConfirmed = waitForMessage(
    socket,
    (message) =>
      message.id === subscriptionId &&
      (message.type === "subscribe_success" ||
        message.type === "subscribe_error"),
  );
  const authorization = await signer.sign({ channel });

  socket.send(
    JSON.stringify({
      authorization,
      channel,
      id: subscriptionId,
      type: "subscribe",
    }),
  );

  const subscriptionResult = await subscriptionConfirmed;
  if (subscriptionResult.type === "subscribe_error") {
    throw new Error(readErrorMessage(subscriptionResult));
  }

  socket.addEventListener("message", (messageEvent) => {
    const message = parseMessage(messageEvent.data);
    if (message.type !== "data" || message.id !== subscriptionId) {
      return;
    }

    const eventPayloads =
      typeof message.event === "string"
        ? [message.event]
        : (message.event ?? []);

    for (const payload of eventPayloads) {
      const event = parseEventPayload(payload);
      if (!isStartEvent(event)) {
        console.error("Start Bridge received an invalid start event:", payload);
        continue;
      }

      void onStartEvent(event).catch((error: unknown) => {
        console.error(`Agent invocation failed: sessionId=${event.sessionId}`);
        console.error(error);
      });
    }
  });

  return socket;
}

function waitForOpen(socket: WebSocket): Promise<void> {
  const socketOpened = new Promise<void>((resolve, reject) => {
    socket.addEventListener("open", () => resolve(), { once: true });
    socket.addEventListener(
      "error",
      () => reject(new Error("AppSync WebSocket connection failed")),
      { once: true },
    );
  });

  return socketOpened;
}

function waitForMessage(
  socket: WebSocket,
  matches: (message: AppSyncMessage) => boolean,
): Promise<AppSyncMessage> {
  const matchingMessage = new Promise<AppSyncMessage>((resolve, reject) => {
    function handleMessage(messageEvent: MessageEvent) {
      try {
        const message = parseMessage(messageEvent.data);
        if (!matches(message)) {
          return;
        }

        socket.removeEventListener("message", handleMessage);
        resolve(message);
      } catch (error) {
        socket.removeEventListener("message", handleMessage);
        reject(error);
      }
    }

    socket.addEventListener("message", handleMessage);
  });

  return matchingMessage;
}

function parseMessage(data: unknown): AppSyncMessage {
  if (typeof data !== "string") {
    throw new Error("AppSync returned a non-text WebSocket message");
  }

  return JSON.parse(data) as AppSyncMessage;
}

function readErrorMessage(message: AppSyncMessage): string {
  return message.errors?.[0]?.message ?? "AppSync subscription failed";
}
