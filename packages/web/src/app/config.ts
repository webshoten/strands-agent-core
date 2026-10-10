export type WebConfig = {
  appSyncHttpHost: string;
  appSyncRealtimePath: string;
  awsRegion: string;
  eventApiHttpEndpoint: string;
  lambdaAuthorizationToken: string;
  userPoolId: string;
  webUserPoolClientId: string;
};

declare global {
  interface Window {
    __STRANDS_CONFIG__?: WebConfig;
  }
}

/** CDKが配置する実行時設定を読み取る。 */
export function getWebConfig(): WebConfig {
  const config = window.__STRANDS_CONFIG__;
  if (!config) {
    throw new Error("config.js is not loaded");
  }
  return config;
}
