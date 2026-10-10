export type StartEvent = {
  type: "start";
  sessionId: string;
};

export type MessageEvent = {
  type: "message";
  sessionId: string;
  sequence: number;
  text: string;
  timestamp: string;
};

export type CompletedEvent = {
  type: "completed";
  sessionId: string;
  timestamp: string;
};

export type SessionEvent = MessageEvent | CompletedEvent;

/** 値が開始イベントの形式を満たすか判定する。 */
export function isStartEvent(value: unknown): value is StartEvent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<StartEvent>;
  return candidate.type === "start" && typeof candidate.sessionId === "string";
}

/** AppSync EventsのpayloadをJSON値として読み取る。 */
export function parseEventPayload(payload: unknown): unknown {
  if (typeof payload !== "string") {
    return payload;
  }

  try {
    return JSON.parse(payload) as unknown;
  } catch {
    return payload;
  }
}
