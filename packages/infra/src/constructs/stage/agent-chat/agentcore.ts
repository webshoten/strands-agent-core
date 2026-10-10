import { agentCorePackagePath } from "@infra/common/paths.ts";
import * as agentcore from "aws-cdk-lib/aws-bedrockagentcore";
import * as iam from "aws-cdk-lib/aws-iam";
import type { Construct } from "constructs";

export type AgentCoreRuntimeProps = {
  appSyncHttpHost: string;
};

/** StrandsアプリをZIP直接デプロイするAgentCore Runtimeを作成する。 */
export class AgentCoreRuntime extends agentcore.Runtime {
  constructor(scope: Construct, id: string, props: AgentCoreRuntimeProps) {
    super(scope, id, {
      agentRuntimeArtifact: agentcore.AgentRuntimeArtifact.fromCodeAsset({
        entrypoint: ["main.py"],
        path: agentCorePackagePath,
        runtime: agentcore.AgentCoreRuntime.PYTHON_3_13,
      }),
      description: "Strands AppSync Events end-to-end MVP",
      environmentVariables: {
        APPSYNC_HTTP_HOST: props.appSyncHttpHost,
      },
      runtimeName: "strands_appsync_mvp",
    });

    this.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream",
        ],
        resources: ["*"],
      }),
    );
  }
}
