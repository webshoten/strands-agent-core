# 第2 MVP仕様書

## 目的

第1 MVPのAWS構成を利用しながら、React、開始ブリッジ、Agentをローカルでデバッグ実行できる開発環境を追加する。

VS Codeから3つのプロセスをまとめて起動する。コードを保存すると各プロセスへ変更が自動反映され、AWSへ再デプロイせずに動作を確認できる状態にする。

## 構成

### ローカル

- React：Viteで画面を配信する。
- 開始ブリッジ：Node.jsでAppSync Eventsの開始イベントを受信し、ローカルAgentを呼び出す。
- Agent：Python、AgentCore SDK、Strands Agentsで処理を実行する。

### AWS

- Cognito User Pool：Reactのユーザーを認証する。
- AppSync Events：開始イベントとセッションイベントを配信する。
- Amazon Bedrock：Strands Agentがモデルを呼び出す。

## ローカル構成図

```text
React / Vite
  │
  ├─ Cognitoへログイン
  ├─ /sessions/{sessionId}を購読
  └─ /local-commands/{sessionId}へ開始イベントを送信
                         │
                         ▼
                  AppSync Events
                         │ WebSocket
                         ▼
               Node.js 開始ブリッジ
                         │ HTTP POST
                         ▼
             http://localhost:8080/invocations
                         │
                         ▼
              Python Agent / Strands
                         │
                         ├─ Bedrockを呼び出す
                         └─ AppSync EventsへHTTP publish
                                      │
                                      ▼
                              Reactがイベントを受信
```

## チャネル

- `/commands/{sessionId}`：AWS環境で開始Lambdaを呼び出す。
- `/local-commands/{sessionId}`：ローカルの開始ブリッジが開始イベントを購読する。
- `/sessions/{sessionId}`：AWS環境とローカル環境でAgentが出力を送り、Reactが購読する。

開発ステージのAppSync Eventsに`local-commands`チャネル名前空間を追加する。ReactからのpublishにはCognito認証、開始ブリッジのsubscribeにはIAM認証を使用する。

開始イベントの経路だけを実行環境に応じて切り替える。AgentからReactへ結果を返す`/sessions/{sessionId}`は共通で使用する。

## 処理フロー

1. VS CodeがReact、開始ブリッジ、Agentを起動する。
2. ReactがCognitoへログインする。
3. ReactがAppSync Eventsの`/sessions/{sessionId}`を購読する。
4. Reactが`/local-commands/{sessionId}`へ開始イベントを送る。
5. 開始ブリッジがWebSocketで開始イベントを受信する。
6. 開始ブリッジがAgentの`/invocations`へ`sessionId`を送る。
7. `BedrockAgentCoreApp`が`main()`を呼び出す。
8. Strands AgentがAmazon Bedrockのモデルを呼び出す。
9. Agentが`/sessions/{sessionId}`へメッセージイベントと完了イベントを送る。
10. AppSync Eventsが購読中のReactへイベントを配信する。
11. Reactが受信内容と完了状態を表示する。

## VS Codeからの起動

`.vscode/launch.json`に次の起動設定を用意する。

- `Local: Web`：ReactとViteを起動し、HMRを有効にした状態でブラウザのTypeScriptをデバッグする。
- `Local: Start Bridge`：Node.jsの開始ブリッジをwatchモードで起動してデバッグする。
- `Local: Agent`：Python AgentをUvicornのreloadモードで起動してデバッグする。
- `Local: All`：3つの起動設定をまとめて実行する。

`.vscode/tasks.json`に次のタスクを用意する。

- `Local: Setup`：Node.js依存関係、Python 3.13、Python仮想環境を準備する。
- `Local: Load Config`：開発ステージのSSM Parameter Storeからローカル設定を取得する。
- `Local: Web`：Viteを起動する。

`Local: All`の実行時に`Local: Load Config`を先に実行し、React、開始ブリッジ、Agentへ同じAWS環境の設定を渡す。

## Python環境

- Python 3.13をローカル実行とAgentCore向けビルドで共通使用する。
- Pythonの要求バージョンは`packages/agentcore/.python-version`で`3.13`に固定する。
- `uv python install 3.13`でPython 3.13を準備する。
- `uv`で`packages/agentcore/.venv`を作成する。
- `packages/agentcore/requirements.lock.txt`から依存関係を同期する。
- VS CodeのPythonデバッガーは`packages/agentcore/.venv`のPythonを使用する。
- Uvicornへ`main:app`を指定し、`packages/agentcore/src`をreload対象にする。
- VS CodeのPythonデバッガーで`subProcess`を有効にし、reload後のAgentプロセスにもデバッガーを接続する。

`Local: Setup`は同じ状態に対して繰り返し実行できるようにする。

Pythonコードを保存するとUvicornがAgentプロセスを再起動する。VS Codeは再起動後のプロセスへ接続し、設定済みのブレークポイントを引き続き使用できるようにする。

## ローカル設定

セットアップ処理が開発ステージのSSM Parameter Storeから次の値を取得する。

- AWSリージョン
- AppSync EventsのHTTPエンドポイント
- Cognito User Pool ID
- Cognito User Pool Client ID

Reactのローカル設定では、開始イベントの送信先を`local-commands`に設定する。

開始ブリッジとAgentは、VS Codeへ設定したAWSプロファイルを使用する。開始ブリッジはAppSync Eventsの購読、AgentはBedrock呼び出しとAppSync EventsへのpublishにAWS認証情報を使用する。

ローカル設定は生成ファイルとして扱い、SSM Parameter Storeの値から毎回更新する。AWSプロファイル名とSSM階層の`stage`、`sharedEnv`はVS Codeの入力値として受け取る。

### Reactの開始チャネル設定

`WebConfig`に`startChannelNamespace`を追加する。

AWS環境ではCDKが次の値を設定する。

```json
{
  "startChannelNamespace": "commands"
}
```

ローカル環境では`Local: Load Config`が次の値を設定する。

```json
{
  "startChannelNamespace": "local-commands"
}
```

Reactは開始イベントの送信先を次の形式で組み立てる。

```ts
const channel = `/${config.startChannelNamespace}/${event.sessionId}`;
```

### `config.js`の管理

- `packages/web/public/config.example.js`：設定項目の例としてGitで管理する。
- `packages/web/public/config.js`：実行環境に合わせて生成する。
- ローカル実行：`Local: Load Config`がSSM Parameter Storeの値から生成する。
- AWS実行：CDKがデプロイ時に生成してS3へ配置する。

生成された`packages/web/public/config.js`はGitの管理対象から外す。

## 開始ブリッジ

開始ブリッジは、AWS上のAppSync EventsとローカルAgentの間だけを接続する。

起動時に次の処理を行う。

1. Node.jsのAWSデフォルト認証情報プロバイダーから認証情報を取得する。
2. AppSync EventsのWebSocket接続をSigV4で認証する。
3. AppSyncから`connection_ack`を受信する。
4. `/local-commands/*`を購読する。
5. AppSyncから`subscribe_success`を受信し、開始イベントの待受状態に入る。

開始イベントを受信するたびに次の処理を行う。

1. `packages/shared`の`StartEvent`として検証する。
2. `http://localhost:8080/invocations`へHTTP POSTする。
3. AgentCore SDKのローカルサーバーから返るレスポンスを最後まで読み取る。

接続失敗と購読失敗は標準エラーへ出力してプロセスを終了する。Agent呼び出し失敗は対象の`sessionId`とともに標準エラーへ出力し、次の開始イベントを受け付ける。

## IAM権限

開始ブリッジが使用するAWSプロファイルには、開発ステージのAppSync Eventsに対する次の権限が必要になる。

- `appsync:EventConnect`
- `appsync:EventSubscribe`

Agentが使用するAWSプロファイルには次の権限が必要になる。

- Amazon Bedrockのモデル呼び出し
- `appsync:EventPublish`

権限の対象リソースは、開発ステージのEvent APIと対象チャネルに限定する。

## イベント形式

開始イベント、メッセージイベント、完了イベントには`packages/shared`の型を使用する。

```json
{
  "type": "start",
  "sessionId": "UUID"
}
```

```json
{
  "type": "message",
  "sessionId": "UUID",
  "sequence": 1,
  "text": "Hello World",
  "timestamp": "ISO 8601"
}
```

```json
{
  "type": "completed",
  "sessionId": "UUID",
  "timestamp": "ISO 8601"
}
```

## 実装配置

- `packages/web`：ReactとVite
- `packages/start-bridge`：AppSync EventsとローカルAgentを接続するNode.jsプロセス
- `packages/agentcore`：Python、AgentCore SDK、Strands Agents
- `packages/shared`：AWS環境とローカル環境で共通使用するイベント型
- `packages/infra`：開発用チャネルとローカル設定の出力
- `.vscode`：3プロセスのデバッグ起動設定

## 完了条件

- VS Codeの`Local: All`から3つのローカルプロセスを起動できる。
- ReactからCognitoへログインできる。
- ReactがAWS上のAppSync Eventsへ開始イベントを送信できる。
- 開始ブリッジが開始イベントを受信し、ローカルAgentを呼び出せる。
- ローカルAgentがStrandsからBedrockを呼び出せる。
- ローカルAgentが送った複数の`Hello World`と完了イベントがReactへ届く。
- React、開始ブリッジ、AgentのコードをVS Codeでデバッグできる。
- React、開始ブリッジ、Agentのコードを保存すると、変更が各ローカルプロセスへ自動反映される。
