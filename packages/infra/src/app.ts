import { readSharedEnv, readStage } from "@infra/common/stage.ts";
import { AgentChatStack } from "@infra/stacks/stage/agent-chat/index.ts";
import { App } from "aws-cdk-lib";

const app = new App();
const account = process.env.CDK_DEFAULT_ACCOUNT;
const sharedEnv = readSharedEnv(app);
const stage = readStage(app);

new AgentChatStack(app, "StrandsAgentCoreMvpStack", {
  env: {
    ...(account ? { account } : {}),
    region: process.env.CDK_DEFAULT_REGION ?? "ap-northeast-1",
  },
  sharedEnv,
  stage,
});
