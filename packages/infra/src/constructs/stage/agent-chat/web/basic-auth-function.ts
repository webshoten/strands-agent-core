import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import type { Construct } from "constructs";

/** React配信とWebSocket接続を同じBasic認証で保護するFunctionを作成する。 */
export function createBasicAuthFunction(
  scope: Construct,
  basicAuthValue: string,
): cloudfront.Function {
  return new cloudfront.Function(scope, "BasicAuthFunction", {
    code: cloudfront.FunctionCode.fromInline(`
function handler(event) {
  var request = event.request;
  var authorization = request.headers.authorization;
  var expected = '${basicAuthValue}';

  if (!authorization || authorization.value !== expected) {
    return {
      statusCode: 401,
      statusDescription: 'Unauthorized',
      headers: {
        'www-authenticate': { value: 'Basic realm="Strands MVP"' },
        'cache-control': { value: 'no-store' }
      }
    };
  }

  delete request.headers.authorization;
  return request;
}
`),
    runtime: cloudfront.FunctionRuntime.JS_2_0,
  });
}
