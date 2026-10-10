import json
import logging
import os
import threading
import time
from datetime import UTC, datetime

import boto3
import urllib3
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from botocore.auth import SigV4Auth
from botocore.awsrequest import AWSRequest
from strands import Agent

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

app = BedrockAgentCoreApp()
http_client = urllib3.PoolManager()


def publish_event(channel: str, event: dict[str, object]) -> None:
    """AppSync Eventsへイベントを1件送信する。"""
    host = os.environ["APPSYNC_HTTP_HOST"]
    region = os.environ["AWS_REGION"]
    body = json.dumps({"channel": channel, "events": [json.dumps(event)]})
    request = AWSRequest(
        method="POST",
        url=f"https://{host}/event",
        data=body,
        headers={
            "content-type": "application/json",
            "host": host,
        },
    )

    """AWS署名を行なってAppSyncへHTTPリクエストする"""
    credentials = boto3.Session().get_credentials()
    if credentials is None:
        raise RuntimeError("AWS credentials are unavailable")

    SigV4Auth(credentials.get_frozen_credentials(), "appsync", region).add_auth(
        request
    )
    prepared = request.prepare()
    response = http_client.request(
        "POST",
        prepared.url,
        body=prepared.body,
        headers=dict(prepared.headers.items()),
        timeout=urllib3.Timeout(total=10),
    )
    if not 200 <= response.status < 300:
        raise RuntimeError(
            f"AppSync publish failed: status={response.status} body={response.data!r}"
        )


def run_session(session_id: str, task_id: str) -> None:
    """Strandsを実行し、結果をセッションのチャネルへ送信する。"""
    channel = f"/sessions/{session_id}"
    try:

        """エージェントに送信しつつ2秒おきにHelloWorldを4回送る"""
        agent = Agent()
        result = agent("Reply with exactly: Hello World")
        message_text = str(result).strip() or "Hello World"

        for sequence in range(1, 4):
            publish_event(
                channel,
                {
                    "type": "message",
                    "sessionId": session_id,
                    "sequence": sequence,
                    "text": message_text,
                    "timestamp": datetime.now(UTC).isoformat(),
                },
            )
            time.sleep(2)

        publish_event(
            channel,
            {
                "type": "completed",
                "sessionId": session_id,
                "timestamp": datetime.now(UTC).isoformat(),
            },
        )
    except Exception:
        logger.exception("AgentCore session failed", extra={"sessionId": session_id})
    finally:
        app.complete_async_task(task_id)


@app.entrypoint
def main(payload: dict[str, object]) -> dict[str, str]:
    """AgentCoreからセッション開始要求を受け取る。"""
    session_id = payload.get("sessionId")
    if not isinstance(session_id, str) or not session_id:
        raise ValueError("sessionId is required")

    task_id = app.add_async_task("mvp1-session", {"sessionId": session_id})
    threading.Thread(
        target=run_session,
        args=(session_id, task_id),
        daemon=True,
    ).start()
    return {"status": "accepted", "sessionId": session_id}


if __name__ == "__main__":
    app.run()
