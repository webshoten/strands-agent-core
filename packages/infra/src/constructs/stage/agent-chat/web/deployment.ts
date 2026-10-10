import { webDistPath } from "@infra/common/paths.ts";
import type * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import type * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import type { Construct } from "constructs";

export type CreateWebDeploymentInput = {
  configContent: string;
  destinationBucket: s3.IBucket;
  distribution: cloudfront.Distribution;
};

/** Reactのbuild成果物と実行時config.jsをS3へ配置する。 */
export function createWebDeployment(
  scope: Construct,
  input: CreateWebDeploymentInput,
): s3deploy.BucketDeployment {
  return new s3deploy.BucketDeployment(scope, "Deployment", {
    destinationBucket: input.destinationBucket,
    distribution: input.distribution,
    distributionPaths: ["/*"],
    sources: [
      s3deploy.Source.asset(webDistPath),
      s3deploy.Source.data("config.js", input.configContent),
    ],
  });
}
