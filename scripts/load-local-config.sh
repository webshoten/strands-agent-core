#!/usr/bin/env bash

set -euo pipefail

project_root="$(cd "$(dirname "$0")/.." && pwd)"
local_dir="$project_root/.local"
runtime_env="$local_dir/runtime.env"
web_config="$project_root/packages/web/public/config.js"

aws_profile="${STRANDS_AWS_PROFILE:-default}"
aws_region="${STRANDS_AWS_REGION:-ap-northeast-1}"
shared_env="${STRANDS_SHARED_ENV:--}"
stage="${STRANDS_STAGE:-dev}"

safe_segment_pattern='^[a-zA-Z0-9_-]{1,40}$'
if [[ ! "$shared_env" =~ $safe_segment_pattern ]]; then
  echo "STRANDS_SHARED_ENV must be 1-40 chars: a-z, A-Z, 0-9, _, -" >&2
  exit 1
fi
if [[ ! "$stage" =~ $safe_segment_pattern ]]; then
  echo "STRANDS_STAGE must be 1-40 chars: a-z, A-Z, 0-9, _, -" >&2
  exit 1
fi

aws_arguments=(--region "$aws_region")
if [[ -n "$aws_profile" ]]; then
  aws_arguments+=(--profile "$aws_profile")
fi

parameter_prefix="/strands/shared/$shared_env/stage/$stage/runtime"

function read_parameter() {
  aws "${aws_arguments[@]}" ssm get-parameter \
    --name "$parameter_prefix/$1" \
    --query 'Parameter.Value' \
    --output text
}

runtime_region="$(read_parameter awsRegion)"
event_api_http_endpoint="$(read_parameter eventApiHttpEndpoint)"
user_pool_id="$(read_parameter userPoolId)"
web_user_pool_client_id="$(read_parameter webUserPoolClientId)"

mkdir -p "$local_dir"

node - \
  "$runtime_env" \
  "$web_config" \
  "$aws_profile" \
  "$runtime_region" \
  "$event_api_http_endpoint" \
  "$user_pool_id" \
  "$web_user_pool_client_id" <<'NODE'
import fs from "node:fs";

const [
  runtimeEnvPath,
  webConfigPath,
  awsProfile,
  awsRegion,
  eventApiHttpEndpoint,
  userPoolId,
  webUserPoolClientId,
] = process.argv.slice(2);

if (
  !runtimeEnvPath ||
  !webConfigPath ||
  !awsRegion ||
  !eventApiHttpEndpoint ||
  !userPoolId ||
  !webUserPoolClientId
) {
  throw new Error("Local runtime configuration is incomplete");
}

const eventApiUrl = new URL(eventApiHttpEndpoint);
const runtimeEnvironment = {
  APPSYNC_HTTP_ENDPOINT: eventApiHttpEndpoint,
  APPSYNC_HTTP_HOST: eventApiUrl.host,
  AWS_PROFILE: awsProfile ?? "",
  AWS_REGION: awsRegion,
  LOCAL_AGENT_ENDPOINT: "http://127.0.0.1:8080/invocations",
};
const runtimeEnvContent = Object.entries(runtimeEnvironment)
  .map(([name, value]) => `${name}=${JSON.stringify(value)}`)
  .join("\n");

const webConfig = {
  awsRegion,
  eventApiHttpEndpoint,
  startChannelNamespace: "local-commands",
  userPoolId,
  webUserPoolClientId,
};

fs.writeFileSync(runtimeEnvPath, `${runtimeEnvContent}\n`);
fs.writeFileSync(
  webConfigPath,
  `window.__STRANDS_CONFIG__=${JSON.stringify(webConfig)};\n`,
);
NODE

echo "Local configuration loaded: stage=$stage shared-env=$shared_env"
