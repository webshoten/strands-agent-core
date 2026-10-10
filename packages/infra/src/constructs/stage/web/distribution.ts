import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import type * as s3 from "aws-cdk-lib/aws-s3";
import type { Construct } from "constructs";

export type CreateWebDistributionInput = {
  appSyncRealtimeDns: string;
  basicAuthFunction: cloudfront.Function;
  bucket: s3.Bucket;
  originVerifyValue: string;
};

/** S3のReact配信とAppSync EventsのWebSocketを一つの入口へまとめる。 */
export function createWebDistribution(
  scope: Construct,
  input: CreateWebDistributionInput,
): cloudfront.Distribution {
  const basicAuthAssociation: cloudfront.FunctionAssociation = {
    eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
    function: input.basicAuthFunction,
  };

  return new cloudfront.Distribution(scope, "Distribution", {
    additionalBehaviors: {
      "event/realtime": {
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        compress: false,
        functionAssociations: [basicAuthAssociation],
        origin: new origins.HttpOrigin(input.appSyncRealtimeDns, {
          customHeaders: {
            "x-origin-verify": input.originVerifyValue,
          },
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
        }),
        originRequestPolicy:
          cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
      },
    },
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
