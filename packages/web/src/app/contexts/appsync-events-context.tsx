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

type AppSyncEventsContextValue = {
  connectionState: ConnectionState;
  error: string | undefined;
  socket: WebSocket | undefined;
};

const AppSyncEventsContext = createContext<
  AppSyncEventsContextValue | undefined
>(undefined);

/** AppSync EventsのWebSocket接続をアプリ全体で共有する。 */
export function AppSyncEventsProvider({ children }: PropsWithChildren) {
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
    <AppSyncEventsContext.Provider value={{ connectionState, error, socket }}>
      {children}
    </AppSyncEventsContext.Provider>
  );
}

/** 共有しているAppSync Events接続を取得する。 */
export function useAppSyncEvents(): AppSyncEventsContextValue {
  const context = useContext(AppSyncEventsContext);
  if (!context) {
    throw new Error("AppSyncEventsProvider is required");
  }
  return context;
}
