import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import type * as s3 from "aws-cdk-lib/aws-s3";
import type { Construct } from "constructs";

export type CreateWebDistributionInput = {
  basicAuthFunction: cloudfront.Function;
  bucket: s3.Bucket;
};

/** S3のReactをCloudFrontから配信する。 */
export function createWebDistribution(
  scope: Construct,
  input: CreateWebDistributionInput,
): cloudfront.Distribution {
  const basicAuthAssociation: cloudfront.FunctionAssociation = {
    eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
    function: input.basicAuthFunction,
  };

  return new cloudfront.Distribution(scope, "Distribution", {
    defaultBehavior: {
      cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      functionAssociations: [basicAuthAssociation],
      origin: origins.S3BucketOrigin.withOriginAccessControl(input.bucket),
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
