import { Amplify } from "aws-amplify";
import type { WebConfig } from "@/app/config.ts";

/** CognitoとAppSync EventsをAmplifyへ設定する。 */
export function configureAmplify(config: WebConfig): void {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: config.userPoolId,
        userPoolClientId: config.webUserPoolClientId,
      },
    },
    API: {
      Events: {
        defaultAuthMode: "userPool", // appSyncの認証にcognitoを使うと設定
        endpoint: config.eventApiHttpEndpoint,
        region: config.awsRegion,
      },
    },
  });
}
