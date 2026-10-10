import { RemovalPolicy } from "aws-cdk-lib";
import * as ssm from "aws-cdk-lib/aws-ssm";
import type { Construct } from "constructs";

export type CreateStringParameterInput = {
  parameterName: string;
  stringValue: string;
};

/** Stack間や運用スクリプトへ公開する非機密値をSSM Parameterとして作成する。 */
export function createStringParameter(
  scope: Construct,
  id: string,
  input: CreateStringParameterInput,
): ssm.StringParameter {
  const parameter = new ssm.StringParameter(scope, id, input);
  parameter.applyRemovalPolicy(RemovalPolicy.DESTROY);
  return parameter;
}
