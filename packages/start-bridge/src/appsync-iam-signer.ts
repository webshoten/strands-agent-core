import { Sha256 } from "@aws-crypto/sha256-js";
import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { HttpRequest } from "@smithy/protocol-http";
import { SignatureV4 } from "@smithy/signature-v4";

const appSyncEventsProtocol = "aws-appsync-event-ws";
const requestHeaders = {
  accept: "application/json, text/javascript",
  "content-encoding": "amz-1.0",
  "content-type": "application/json; charset=UTF-8",
};

export class AppSyncIamSigner {
  readonly httpEndpoint: URL;
  readonly realtimeEndpoint: string;
  private readonly signer: SignatureV4;

  constructor(httpEndpoint: string, region: string) {
    this.httpEndpoint = new URL(httpEndpoint);
    this.realtimeEndpoint = buildRealtimeEndpoint(this.httpEndpoint);
    this.signer = new SignatureV4({
      credentials: fromNodeProviderChain(),
      region,
      service: "appsync",
      sha256: Sha256,
    });
  }

  async createConnectionProtocols(): Promise<string[]> {
    const authorization = await this.sign({});
    const encodedAuthorization = Buffer.from(
      JSON.stringify(authorization),
    ).toString("base64url");

    return [appSyncEventsProtocol, `header-${encodedAuthorization}`];
  }

  async sign(body: object): Promise<Record<string, string>> {
    const bodyText = JSON.stringify(body);
    const request = new HttpRequest({
      body: bodyText,
      headers: {
        ...requestHeaders,
        host: this.httpEndpoint.hostname,
      },
      hostname: this.httpEndpoint.hostname,
      method: "POST",
      path: this.httpEndpoint.pathname,
      protocol: this.httpEndpoint.protocol,
    });
    const signedRequest = await this.signer.sign(request);

    return signedRequest.headers;
  }
}

function buildRealtimeEndpoint(httpEndpoint: URL): string {
  const realtimeHost = httpEndpoint.hostname.replace(
    ".appsync-api.",
    ".appsync-realtime-api.",
  );
  return `wss://${realtimeHost}/event/realtime`;
}
