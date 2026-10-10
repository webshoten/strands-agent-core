import { RemovalPolicy } from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import type { Construct } from "constructs";

/** Reactの静的ファイルを非公開で保持するBucketを作成する。 */
export function createWebBucket(scope: Construct): s3.Bucket {
  return new s3.Bucket(scope, "Bucket", {
    autoDeleteObjects: true,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    encryption: s3.BucketEncryption.S3_MANAGED,
    enforceSSL: true,
    removalPolicy: RemovalPolicy.DESTROY,
  });
}
