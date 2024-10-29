enum WebSocketCloseCode {
  NORMAL_CLOSURE = 1000,
  GOING_AWAY = 1001,
  PROTOCOL_ERROR = 1002,
  UNSUPPORTED_DATA = 1003,
  NO_STATUS_RECVD = 1005,
  ABNORMAL_CLOSURE = 1006,
  INVALID_FRAME_PAYLOAD_DATA = 1007,
  POLICY_VIOLATION = 1008,
  MESSAGE_TOO_BIG = 1009,
  MISSING_EXTENSION = 1010,
  INTERNAL_ERROR = 1011,
  SERVICE_RESTART = 1012,
  TRY_AGAIN_LATER = 1013,
  BAD_GATEWAY = 1014,
  TLS_HANDSHAKE = 1015,
}

const WebSocketCloseReason = {
  [WebSocketCloseCode.NORMAL_CLOSURE]:
    "The connection has been closed cleanly.",
  [WebSocketCloseCode.GOING_AWAY]: "The endpoint is going away.",
  [WebSocketCloseCode.PROTOCOL_ERROR]:
    "The endpoint is terminating the connection due to a protocol error.",
  [WebSocketCloseCode.UNSUPPORTED_DATA]:
    "The connection is being terminated because the endpoint received data of a type it cannot accept.",
  [WebSocketCloseCode.NO_STATUS_RECVD]:
    "Indicates that no status code was provided even though one was expected.",
  [WebSocketCloseCode.ABNORMAL_CLOSURE]:
    "Indicates that the connection was closed abnormally, e.g., without sending or receiving a Close control frame.",
  [WebSocketCloseCode.INVALID_FRAME_PAYLOAD_DATA]:
    "Indicates that an endpoint is terminating the connection because it has received a message that is too big for it to process.",
  [WebSocketCloseCode.POLICY_VIOLATION]:
    "Indicates that an endpoint is terminating the connection because it has received a message that violates its policy.",
  [WebSocketCloseCode.MESSAGE_TOO_BIG]:
    "Indicates that an endpoint is terminating the connection because it has received a message that is too big.",
  [WebSocketCloseCode.MISSING_EXTENSION]:
    "Designated for use in applications expecting a status code to indicate that the connection was closed due to a failure to perform a TLS handshake (e.g., the server certificate can't be verified).",
  [WebSocketCloseCode.INTERNAL_ERROR]:
    "Indicates that an internal server error has occurred.",
  [WebSocketCloseCode.SERVICE_RESTART]:
    "Indicates that the server is restarting.",
  [WebSocketCloseCode.TRY_AGAIN_LATER]:
    "Indicates that the server is overloaded and the client should try again later.",
  [WebSocketCloseCode.BAD_GATEWAY]:
    "Indicates that a gateway or proxy server received an invalid response from an inbound server.",
  [WebSocketCloseCode.TLS_HANDSHAKE]:
    "Indicates that a connection was closed due to a failure to perform a TLS handshake (e.g., the server certificate can't be verified).",
} as const;

type WebSocketEvent = "open" | "message" | "close" | "error";
type WebSocketStatus = "pending" | "success" | "error";
type WebSocketFetchStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected";

interface SocketProps {
  baseUrl: string;
  log?: WebSocketEvent[];
  retry?: boolean;
  retryDelay?: number;
}

export class Socket<Get = unknown, Post = never> {
  #ws: WebSocket | null;
  #log: WebSocketEvent[];
  #retry: boolean;
  #retryDelay: number;
  #timerId: Timer | null = null;

  constructor({
    log = ["open", "close", "error"],
    retryDelay = 1000,
    retry = false,
  }: SocketProps) {
    this.#ws = null;
    this.#log = log;
    this.#retry = retry;
    this.#retryDelay = retryDelay;
  }

  status: WebSocketStatus = "pending";
  fetchStatus: WebSocketFetchStatus = "idle";

  #reconnect = (url: string, setMessage: (value: Get) => void) => {
    this.#timerId = setTimeout(() => {
      this.connect(url, setMessage);
    }, this.#retryDelay);
  };

  connect = (url: string, setMessage: (value: Get) => void) => {
    this.#ws = new WebSocket(url);
    this.fetchStatus = "connecting";

    this.#ws.onopen = (ev: Event) => {
      this.fetchStatus = "connected";

      if (this.#log.includes("open")) {
        const target = ev.target as WebSocket;
        console.info("WebSocket connected", {
          url: target.url,
        });
      }
    };

    this.#ws.onmessage = (ev: MessageEvent) => {
      this.status = "success";

      try {
        const data = JSON.parse(ev.data);
        queueMicrotask(() => setMessage(data));

        if (this.#log.includes("message")) {
          const target = ev.target as WebSocket;
          console.info("WebSocket message received", {
            data: ev.data,
            url: target.url,
          });
        }
      } catch (err) {
        if (this.#log.includes("error")) {
          const target = ev.target as WebSocket;
          console.error("Error occurred while updating socket", {
            data: ev.data,
            url: target.url,
            error: err,
          });
        }
      }
    };

    this.#ws.onclose = (ev: CloseEvent) => {
      this.fetchStatus = "disconnected";

      if (this.#log.includes("close")) {
        const target = ev.target as WebSocket;
        const errorCode = ev.code as WebSocketCloseCode;

        console.info("WebSocket disconnected", {
          url: target.url,
          reason: WebSocketCloseCode[errorCode],
          explanation: WebSocketCloseReason[errorCode],
          code: errorCode,
        });
      }

      if (this.#retry) {
        if (ev.code === WebSocketCloseCode.ABNORMAL_CLOSURE) {
          this.#reconnect(url, setMessage);
        }
      } else {
        if (this.#timerId) {
          clearTimeout(this.#timerId);
        }
        this.#ws = null;
      }
    };

    this.#ws.onerror = (ev: Event) => {
      this.status = "error";

      if (this.#log.includes("error")) {
        const target = ev.target as WebSocket;
        console.error("WebSocket error", {
          url: target.url,
          error: ev,
        });
      }
    };

    return this.close;
  };

  get instance() {
    return this.#ws;
  }

  close = () => {
    if (this.#ws?.readyState !== WebSocket.CLOSED) {
      this.#ws?.close();
    }
  };

  send = (data: Post) => {
    if (this.#ws?.readyState === WebSocket.OPEN) {
      this.#ws.send(JSON.stringify(data));
    }
  };

  on = (event: WebSocketEvent, callback: (ev: Event) => void) => {
    this.#ws?.addEventListener(event, callback);
  };
}

const socket = new Socket<{ message: string }, { data: boolean }>({
  baseUrl: "ws://localhost:8080",
});

socket.connect("ws://localhost:8080", (data) => {
  console.log(data);
});

socket.send({
  data: true,
});

socket.connect("/api/v1/data", (data) => {
  console.log(data);
});
