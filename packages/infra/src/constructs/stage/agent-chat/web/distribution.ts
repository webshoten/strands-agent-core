import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import type * as s3 from "aws-cdk-lib/aws-s3";
import type { Construct } from "constructs";

/** S3のReactをCloudFrontから配信する。 */
export function createWebDistribution(
  scope: Construct,
  bucket: s3.Bucket,
): cloudfront.Distribution {
  return new cloudfront.Distribution(scope, "Distribution", {
    defaultBehavior: {
      cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      origin: origins.S3BucketOrigin.withOriginAccessControl(bucket),
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    },
    defaultRootObject: "index.html",
    errorResponses: [
      {
        httpStatus: 403,
        responseHttpStatus: 200,
        responsePagePath: "/index.html",
      },
      {
        httpStatus: 404,
        responseHttpStatus: 200,
        responsePagePath: "/index.html",
      },
    ],
  });
}
