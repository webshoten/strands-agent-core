# Strands AgentCore MVP

AWS上でReact、CloudFront、AppSync Events、Lambda、Bedrock AgentCore Runtime、Strandsを一通り接続する第1 MVPです。

## 構成

- `packages/infra`: AWS CDK（TypeScript）
- `packages/web`: React + Vite
- `packages/functions`: AppSync EventsからAgentCoreを呼び出す開始Lambda
- `packages/start-bridge`: AppSync EventsからローカルAgentを呼び出す開始ブリッジ
- `packages/shared`: フロントエンドとLambdaで共有するイベント型
- `packages/agentcore`: AgentCore SDK + Strands（Python）
- `docs/mvp1`: 第1 MVPの仕様書とアーキテクチャ図
- `docs/mvp2`: ローカル開発環境の仕様書

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

## ローカル開発

React、開始ブリッジ、Python Agentをローカルで起動し、AWS上のCognito、AppSync Events、Amazon Bedrockへ接続します。

### 初回セットアップ

```sh
pnpm local:setup
```

このコマンドは次の準備を行います。

- Node.js依存関係のインストール
- Python 3.13の準備
- `packages/agentcore/.venv`の作成
- Agent用Python依存関係のインストール

### AWS側の更新

ローカル開発用の`local-commands`チャネルをAppSync Eventsへ追加するため、CDKをデプロイします。

```sh
pnpm build
pnpm --filter @strands/infra cdk deploy
```

### VS Codeから起動

VS Codeの「実行とデバッグ」で`Local: All`を起動します。

起動時にSSM Parameter Storeから開発環境の設定を取得し、次の3プロセスをまとめて起動します。

- `Local: Web`：ReactとVite
- `Local: Start Bridge`：AppSync Eventsを購読するNode.jsプロセス
- `Local: Agent`：AgentCore SDKとStrandsを実行するPythonプロセス

コードを保存すると、ReactはHMR、開始ブリッジはNode.jsのwatch、Python AgentはUvicornのreloadによって変更が反映されます。

AWSプロファイル、リージョン、Stageは`.vscode/settings.json`で設定します。

```json
{
  "strands.awsProfile": "default",
  "strands.awsRegion": "ap-northeast-1",
  "strands.sharedEnv": "-",
  "strands.stage": "dev"
}
```

設定だけを再取得する場合は次のコマンドを実行します。

```sh
pnpm local:config
```

## 認証ユーザー

メールアドレスとパスワードを引数で渡し、Cognitoユーザーを作成します。同じメールアドレスで再実行した場合は、既存ユーザーの属性とパスワードを更新します。

```sh
pnpm cognito:user -m test@example.com -p Password123@
```

異なるStack名でデプロイした場合は、`STACK_NAME`も指定します。
