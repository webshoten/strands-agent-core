# 第1 MVP仕様書

## 目的

本番と同じAWSインフラを構築し、ブラウザから開始した処理の結果が、AgentCore RuntimeからAppSync EventsのWebSocketを通じてブラウザへ届くことを確認する。

## 技術構成

- フロントエンド：React
- Infrastructure as Code：AWS CDK（TypeScript）
- フロントエンド配信：CloudFront、非公開S3、Origin Access Control
- リアルタイム通信：AppSync Events
- 処理開始：AWS Lambda
- エージェント実行環境：Bedrock AgentCore Runtime
- AgentCoreアプリケーション：Python、AgentCore SDK、Strands Agents
- 認証：CloudFront FunctionによるBasic認証、AppSync Lambda Authorizer

## AWS構成

- CloudFrontはReactの静的ファイルとAppSync EventsへのWebSocket接続を同じドメインで受け付ける。
- `/event/realtime`はAppSync Eventsへ転送する。
- その他のパスは非公開S3へ転送する。
- CloudFront Functionは各リクエストのBasic認証を行う。
- CloudFrontはAppSync向けリクエストへオリジン確認用ヘッダーを付与する。
- AppSync Lambda Authorizerはオリジン確認用ヘッダーを検証する。
- AgentCoreからAppSyncへのイベント発行にはIAM認証を使用する。

## チャネル

- `/commands/{sessionId}`：ブラウザが処理開始イベントを送る。
- `/sessions/{sessionId}`：ブラウザがAgentCoreからの出力を購読する。

## 処理フロー

1. ブラウザがCloudFrontへアクセスし、Basic認証を行う。
2. CloudFrontがS3からReactを配信する。
3. ReactがCloudFront経由でAppSync EventsへWebSocket接続する。
4. Reactが`/sessions/{sessionId}`を購読する。
5. Reactが`/commands/{sessionId}`へ開始イベントを送る。
6. AppSync Eventsが開始Lambdaを非同期で呼び出す。
7. 開始Lambdaが`sessionId`を指定してAgentCore Runtimeを呼び出す。
8. AgentCore上のPythonアプリケーションがバックグラウンド処理を開始する。
9. AgentCoreが一定間隔で複数回、AppSync Eventsへ`Hello World`イベントを送る。
10. AppSync Eventsが購読中のブラウザへイベントを配信する。
11. Reactが受信したイベントを順番に画面へ表示する。
12. AgentCoreが完了イベントを送り、Reactが完了状態を表示する。

## イベント形式

開始イベント：

```json
{
  "type": "start",
  "sessionId": "UUID"
}
```

出力イベント：

```json
{
  "type": "message",
  "sessionId": "UUID",
  "sequence": 1,
  "text": "Hello World",
  "timestamp": "ISO 8601"
}
```

完了イベント：

```json
{
  "type": "completed",
  "sessionId": "UUID",
  "timestamp": "ISO 8601"
}
```

## フロントエンド

- Basic認証後にMVP画面を表示する。
- 接続状態を表示する。
- 開始ボタンで新しい`sessionId`を生成する。
- 受信した`Hello World`を受信順に表示する。
- 完了イベントの受信後に完了状態を表示する。

## MVP2へ引き継ぐ項目

- React、Lambda想定サーバー、AgentCore想定サーバーによるローカル一連実行
- Cognitoを使用したユーザー認証
- ReactによるCognitoログインとJWT取得
- AppSync Eventsに対するCognito認証での送信と購読

## 完了条件

- CDKでAWSリソース一式をデプロイできる。
- CloudFrontのURLからReact画面を表示できる。
- Basic認証がReact配信とWebSocket接続に適用される。
- 開始ボタンからAgentCore Runtimeまで処理が到達する。
- 複数件の`Hello World`と完了イベントがWebSocketで画面へ届く。
- AppSyncの標準エンドポイントへの直接接続がLambda Authorizerで拒否される。

## 実装配置

- `packages/infra`：AWS CDK
- `packages/web`：React
- `packages/functions`：開始Lambda、Lambda Authorizer
- `packages/shared`：イベント型
- `packages/agentcore`：Python、AgentCore SDK、Strands Agents
