import type { WebConfig } from "@/app/config.ts";
import { encodeBase64Url } from "@/common/lib/base64-url.ts";

type ConnectionResponse = {
  type?: string;
  errors?: Array<{ message?: string }>;
};

export type ConnectionState =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

type ConnectionHandlers = {
  onConnected: (socket: WebSocket) => void;
  onDisconnected: () => void;
  onError: (error: Error) => void;
};

/** AppSync Eventsとの接続を開始し、切断処理を返す。 */
export function openAppSyncEvents(
  config: WebConfig,
  handlers: ConnectionHandlers,
): () => void {
  const authorization = {
    Authorization: config.lambdaAuthorizationToken, // AppSyncのLambda Authorizerへ渡す認証トークン
    host: config.appSyncHttpHost, //xxxxxxxx.appsync-api.ap-northeast-1.amazonaws.com
  };
  const protocol = `header-${encodeBase64Url(JSON.stringify(authorization))}`; //appSyncのルール
  const scheme = location.protocol === "https:" ? "wss" : "ws";
  const socket = new WebSocket(
    `${scheme}://${location.host}${config.appSyncRealtimePath}`,
    [
      protocol,
      "aws-appsync-event-ws", /**  AppSync EventsのWebSocketプロトコルを使用する宣言 */
    ],
  );

  function removeAllListeners() {
    socket.removeEventListener("open", handleOpen);
    socket.removeEventListener("message", handleMessage);
    socket.removeEventListener("error", handleError);
    socket.removeEventListener("close", handleClose);
  }

  function fail(error: Error) {
    removeAllListeners();
    socket.close(1000);
    handlers.onError(error);
  }

  /**
   * WebSocket接続が開いたので、AppSync上の通信セッションを初期化
   */
  function handleOpen() {
    // connection_initはAWS AppSync EventsのWebSocketプロトコルで決められた文字
    socket.send(JSON.stringify({ type: "connection_init" }));
  }

  function handleMessage(messageEvent: MessageEvent<string>) {
    const message = JSON.parse(messageEvent.data) as ConnectionResponse;

    // appSyncからtype=connection_ackが送られてくる場合新規購読開始とする
    if (message.type === "connection_ack") {
      // AppSyncとのWebSocket通信を開始できる状態になった
      socket.removeEventListener("open", handleOpen);
      socket.removeEventListener("message", handleMessage);
      socket.removeEventListener("error", handleError);
      handlers.onConnected(socket);
      return;
    }

    // appSyncからtype=***_errorが送られてくる場合
    if (message.type?.endsWith("_error")) {
      const detail = message.errors?.[0]?.message ??
        "WebSocket authorization failed";
      fail(new Error(detail));
    }
  }

  function handleError() {
    fail(new Error("WebSocket connection failed"));
  }

  function handleClose() {
    removeAllListeners();
    handlers.onDisconnected();
  }

  socket.addEventListener("open", handleOpen);
  socket.addEventListener("message", handleMessage);
  socket.addEventListener("error", handleError);
  socket.addEventListener("close", handleClose);

  return () => {
    removeAllListeners();
    socket.close(1000);
  };
}
