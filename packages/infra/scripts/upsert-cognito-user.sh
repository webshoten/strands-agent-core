#!/usr/bin/env bash

set -euo pipefail

stack_name="${STACK_NAME:-StrandsAgentCoreMvpStack}"
cognito_user_email=""
cognito_user_password=""

function print_usage() {
  echo "Usage: pnpm cognito:user -m <email> -p <password>" >&2
}

while getopts ":m:p:" option; do
  case "$option" in
    m)
      cognito_user_email="$OPTARG"
      ;;
    p)
      cognito_user_password="$OPTARG"
      ;;
    *)
      print_usage
      exit 1
      ;;
  esac
done

if [[ -z "$cognito_user_email" ]]; then
  print_usage
  exit 1
fi

if [[ -z "$cognito_user_password" ]]; then
  print_usage
  exit 1
fi

if [[ "$cognito_user_email" == *[“”‘’]* || "$cognito_user_password" == *[“”‘’]* ]]; then
  echo "Use straight quotes (' or \"), not curly quotes (“ ” or ‘ ’)" >&2
  exit 1
fi

user_pool_id="$(
  aws cloudformation describe-stacks \
    --stack-name "$stack_name" \
    --query 'Stacks[0].Outputs[?OutputKey==`UserPoolId`].OutputValue | [0]' \
    --output text
)"

if [[ -z "$user_pool_id" || "$user_pool_id" == "None" ]]; then
  echo "UserPoolId was not found in stack: $stack_name" >&2
  exit 1
fi

cognito_username="$(
  aws cognito-idp list-users \
    --user-pool-id "$user_pool_id" \
    --filter "email = \"$cognito_user_email\"" \
    --query 'Users[0].Username' \
    --output text
)"

if [[ -z "$cognito_username" || "$cognito_username" == "None" ]]; then
  cognito_username="$(
    aws cognito-idp admin-create-user \
      --user-pool-id "$user_pool_id" \
      --username "$cognito_user_email" \
      --message-action SUPPRESS \
      --user-attributes \
        Name=email,Value="$cognito_user_email" \
        Name=email_verified,Value=true \
      --query 'User.Username' \
      --output text
  )"
fi

aws cognito-idp admin-update-user-attributes \
  --user-pool-id "$user_pool_id" \
  --username "$cognito_username" \
  --user-attributes \
    Name=email,Value="$cognito_user_email" \
    Name=email_verified,Value=true

aws cognito-idp admin-enable-user \
  --user-pool-id "$user_pool_id" \
  --username "$cognito_username"

aws cognito-idp admin-set-user-password \
  --user-pool-id "$user_pool_id" \
  --username "$cognito_username" \
  --password "$cognito_user_password" \
  --permanent

echo "Cognito user is ready: $cognito_user_email"
