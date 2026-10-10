import { createBasicAuthFunction } from "@infra/constructs/stage/web/basic-auth-function.ts";
import { createWebBucket } from "@infra/constructs/stage/web/bucket.ts";
import { buildWebConfigContent } from "@infra/constructs/stage/web/config.ts";
import { createWebDeployment } from "@infra/constructs/stage/web/deployment.ts";
import { createWebDistribution } from "@infra/constructs/stage/web/distribution.ts";
import type * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import { Construct } from "constructs";

export type WebProps = {
  appSyncHttpHost: string;
  appSyncRealtimeDns: string;
  basicAuthValue: string;
  originVerifyValue: string;
};

/** 第1 MVPのReact配信リソースとAppSync WebSocket経路を作成する。 */
export class Web extends Construct {
  readonly distribution: cloudfront.Distribution;
  readonly url: string;

  constructor(scope: Construct, id: string, props: WebProps) {
    super(scope, id);

    const bucket = createWebBucket(this);
    const basicAuthFunction = createBasicAuthFunction(
      this,
      props.basicAuthValue,
    );
    const distribution = createWebDistribution(this, {
      appSyncRealtimeDns: props.appSyncRealtimeDns,
      basicAuthFunction,
      bucket,
      originVerifyValue: props.originVerifyValue,
    });
    const configContent = buildWebConfigContent({
      appSyncHttpHost: props.appSyncHttpHost,
      appSyncRealtimePath: "/event/realtime",
      lambdaAuthorizationToken: "mvp1",
    });
    createWebDeployment(this, {
      configContent,
      destinationBucket: bucket,
      distribution,
    });

    this.distribution = distribution;
    this.url = `https://${distribution.distributionDomainName}`;
  }
}
