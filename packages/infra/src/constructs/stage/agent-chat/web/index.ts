import { createBasicAuthFunction } from "@infra/constructs/stage/agent-chat/web/basic-auth-function.ts";
import { createWebBucket } from "@infra/constructs/stage/agent-chat/web/bucket.ts";
import { buildWebConfigContent } from "@infra/constructs/stage/agent-chat/web/config.ts";
import { createWebDeployment } from "@infra/constructs/stage/agent-chat/web/deployment.ts";
import { createWebDistribution } from "@infra/constructs/stage/agent-chat/web/distribution.ts";
import type * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import { Construct } from "constructs";

export type WebProps = {
  awsRegion: string;
  basicAuthValue: string;
  eventApiHttpEndpoint: string;
  userPoolId: string;
  webUserPoolClientId: string;
};

/** 第1 MVPのReact配信リソースと実行時設定を作成する。 */
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
      basicAuthFunction,
      bucket,
    });
    const configContent = buildWebConfigContent({
      awsRegion: props.awsRegion,
      eventApiHttpEndpoint: props.eventApiHttpEndpoint,
      userPoolId: props.userPoolId,
      webUserPoolClientId: props.webUserPoolClientId,
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
