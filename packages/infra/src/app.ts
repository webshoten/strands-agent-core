import { AppStack } from "@infra/stacks/stage/app-stack.ts";
import { App } from "aws-cdk-lib";

const app = new App();
const account = process.env.CDK_DEFAULT_ACCOUNT;

new AppStack(app, "StrandsAgentCoreMvpStack", {
  env: {
    ...(account ? { account } : {}),
    region: process.env.CDK_DEFAULT_REGION ?? "ap-northeast-1",
  },
});
