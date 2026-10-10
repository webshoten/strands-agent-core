export type WebRuntimeConfig = {
  appSyncHttpHost: string;
  appSyncRealtimePath: string;
  awsRegion: string;
  eventApiHttpEndpoint: string;
  lambdaAuthorizationToken: string;
  userPoolId: string;
  webUserPoolClientId: string;
};

/** Reactが起動時に読み込むconfig.jsを生成する。 */
export function buildWebConfigContent(input: WebRuntimeConfig): string {
  return `window.__STRANDS_CONFIG__=${JSON.stringify(input)};`;
}
