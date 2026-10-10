import path from "node:path";
import {
  functionsRoot,
  lockFilePath,
  projectRoot,
} from "@infra/common/paths.ts";
import { Duration } from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as nodejs from "aws-cdk-lib/aws-lambda-nodejs";
import type { Construct } from "constructs";

const sharedBundling: nodejs.BundlingOptions = {
  bundleAwsSDK: true,
  minify: true,
  sourceMap: true,
  target: "node22",
};

export type CreateAuthorizerFunctionInput = {
  originVerifyValue: string;
};

/** AppSyncへ到達した接続がCloudFront経由か確認するLambdaを作成する。 */
export function createAuthorizerFunction(
  scope: Construct,
  input: CreateAuthorizerFunctionInput,
): nodejs.NodejsFunction {
  return new nodejs.NodejsFunction(scope, "AppSyncAuthorizerFunction", {
    bundling: sharedBundling,
    depsLockFilePath: lockFilePath,
    entry: path.join(functionsRoot, "src/authorizer.ts"),
    environment: {
      ORIGIN_VERIFY_VALUE: input.originVerifyValue,
    },
    handler: "handler",
    projectRoot,
    runtime: lambda.Runtime.NODEJS_22_X,
    timeout: Duration.seconds(3),
  });
}

export type CreateStartAgentFunctionInput = {
  agentRuntimeArn: string;
};

/** AppSyncの開始イベントからAgentCore Runtimeを呼び出すLambdaを作成する。 */
export function createStartAgentFunction(
  scope: Construct,
  input: CreateStartAgentFunctionInput,
): nodejs.NodejsFunction {
  return new nodejs.NodejsFunction(scope, "StartAgentFunction", {
    bundling: sharedBundling,
    depsLockFilePath: lockFilePath,
    entry: path.join(functionsRoot, "src/start-agent.ts"),
    environment: {
      AGENT_RUNTIME_ARN: input.agentRuntimeArn,
    },
    handler: "handler",
    memorySize: 256,
    projectRoot,
    runtime: lambda.Runtime.NODEJS_22_X,
    timeout: Duration.seconds(30),
  });
}
