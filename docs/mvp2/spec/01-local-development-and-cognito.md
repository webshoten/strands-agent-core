# 第2 MVP仕様書

## 目的

第1 MVPのAWS構成を基礎として、ローカルで一連の処理を実行できる開発環境と、Cognitoによるユーザー認証を追加する。

## 対象

- React、Lambda想定サーバー、AgentCore想定サーバーによるローカル一連実行
- Cognitoを使用したAWS環境のユーザー認証

## ローカル構成

### React

- ローカル開発サーバーで起動する。
- 開始イベントを送信する。
- セッション単位でWebSocketを購読する。
- 受信したイベントと完了状態を表示する。

### Lambda想定サーバー

- ローカル環境のHTTPとWebSocketの入口を提供する。
- AWS環境と同じ開始イベントを受け付ける。
- 開始Lambdaのハンドラーを呼び出す。
- AgentCore想定サーバーから受け取ったイベントを、セッション単位でReactへ配信する。

### AgentCore想定サーバー

- PythonとAgentCore SDKで起動する。
- `/invocations`でLambda想定サーバーから実行要求を受け付ける。
- `Hello World`イベントと完了イベントをLambda想定サーバーへ送信する。

## ローカル処理フロー

1. ReactがLambda想定サーバーへWebSocket接続する。
2. Reactがセッションの購読を開始する。
3. Reactが開始イベントを送信する。
4. Lambda想定サーバーが開始Lambdaのハンドラーを呼び出す。
5. 開始LambdaのハンドラーがAgentCore想定サーバーの`/invocations`を呼び出す。
6. AgentCore想定サーバーが処理を実行する。
7. AgentCore想定サーバーが出力イベントをLambda想定サーバーへ送信する。
8. Lambda想定サーバーが購読中のReactへイベントを配信する。
9. Reactが受信内容と完了状態を表示する。

## AWS認証構成

- Cognito User Poolでユーザーを管理する。
- ReactがCognitoへログインしてJWTを取得する。
- ReactはJWTを使用してAppSync Eventsへ接続する。
- AppSync Eventsはブラウザからの送信と購読をCognito認証で許可する。
- Lambda AuthorizerはCloudFront経由であることを確認する。
- AgentCoreからAppSync Eventsへのイベント発行にはIAM認証を使用する。
- CloudFront FunctionのBasic認証はCDKの設定でCognito構成へ切り替える。

## 完了条件

- 3つのローカルプロセスを起動して、一連の処理を実行できる。
- ローカルのReactから開始した処理のイベントがWebSocketで画面へ届く。
- ローカルとAWSで同じイベント形式とセッションIDを使用できる。
- CognitoのユーザーがReactへログインできる。
- Cognito認証を使用してAppSync Eventsへ送信・購読できる。
- AgentCoreがIAM認証を使用してAppSync Eventsへイベントを発行できる。
