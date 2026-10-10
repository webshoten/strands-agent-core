import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import { useConfig } from "@/app/contexts/config-context.tsx";
import {
  type ConnectionState,
  openAppSyncEvents,
} from "@/domains/session/services/appsync-events-connection.ts";

type AppSyncConnectionContextValue = {
  connectionState: ConnectionState;
  error: string | undefined;
  socket: WebSocket | undefined;
};

const AppSyncConnectionContext = createContext<
  AppSyncConnectionContextValue | undefined
>(undefined);

/** AppSync EventsのWebSocket接続をアプリ全体で共有する。 */
export function AppSyncConnectionProvider({ children }: PropsWithChildren) {
  const config = useConfig();
  const [socket, setSocket] = useState<WebSocket>();
  const [connectionState, setConnectionState] =
    useState<ConnectionState>("disconnected");
  const [error, setError] = useState<string>();

  useEffect(() => {
    setSocket(undefined);
    setConnectionState("connecting");
    setError(undefined);

    const dispose = openAppSyncEvents(config, {
      onConnected: (connectedSocket) => {
        setSocket(connectedSocket);
        setConnectionState("connected");
      },
      onDisconnected: () => {
        setSocket(undefined);
        setConnectionState("disconnected");
      },
      onError: (reason) => {
        setConnectionState("error");
        setError(reason.message);
      },
    });

    return dispose;
  }, [config]);

  return (
    <AppSyncConnectionContext.Provider
      value={{ connectionState, error, socket }}
    >
      {children}
    </AppSyncConnectionContext.Provider>
  );
}

/** 共有しているAppSync Events接続を取得する。 */
export function useAppSyncConnection(): AppSyncConnectionContextValue {
  const context = useContext(AppSyncConnectionContext);
  if (!context) {
    throw new Error("AppSyncConnectionProvider is required");
  }
  return context;
}
