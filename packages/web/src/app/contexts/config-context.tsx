import {
  createContext,
  type PropsWithChildren,
  useContext,
  useState,
} from "react";
import { getWebConfig, type WebConfig } from "@/app/config.ts";

const ConfigContext = createContext<WebConfig | undefined>(undefined);

/** アプリ全体へ実行時設定を提供する。 */
export function ConfigProvider({ children }: PropsWithChildren) {
  const [config] = useState(getWebConfig);

  return (
    <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
  );
}

/** アプリの実行時設定を取得する。 */
export function useConfig(): WebConfig {
  const config = useContext(ConfigContext);
  if (!config) {
    throw new Error("ConfigProvider is required");
  }
  return config;
}
