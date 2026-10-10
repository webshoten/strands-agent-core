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

```sh
pnpm build
pnpm --filter @strands/infra cdk deploy
```

初回はデプロイ前に `pnpm --filter @strands/infra cdk bootstrap` を実行します。

デプロイ後、CloudFormation出力の `WebUrl` をブラウザで開きます。
