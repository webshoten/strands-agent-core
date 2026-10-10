# Strands AgentCore MVP

AWS上でReact、CloudFront、AppSync Events、Lambda、Bedrock AgentCore Runtime、Strandsを一通り接続する第1 MVPです。

## 構成

- `packages/infra`: AWS CDK（TypeScript）
- `packages/web`: React + Vite
- `packages/functions`: AppSync EventsからAgentCoreを呼び出す開始Lambda
- `packages/shared`: フロントエンドとLambdaで共有するイベント型
- `packages/agentcore`: AgentCore SDK + Strands（Python）
- `docs/mvp1`: 第1 MVPの仕様書とアーキテクチャ図

## 検証

Node.js 22、pnpm 9、Python 3.13、uvを使用します。

```sh
pnpm install
pnpm typecheck
pnpm test
pnpm synth
```

## デプロイ

Basic認証値には `Basic ` と `user:password` のBase64文字列を連結した値を渡します。

```sh
pnpm --filter @strands/infra cdk bootstrap
export BASIC_AUTH_VALUE="Basic $(printf '%s' 'user:password' | base64)"
pnpm build
pnpm --filter @strands/infra cdk deploy \
  --parameters BasicAuthValue="$BASIC_AUTH_VALUE"
```

デプロイ後、CloudFormation出力の `WebUrl` をブラウザで開きます。
