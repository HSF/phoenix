/**
 * Minimal JSON-RPC 2.0 helpers for the agent bridge (zero dependencies). Only
 * the pieces the bridge needs: recognizing a request, telling a notification
 * apart, validating ids, and building responses, errors and notifications.
 */

/** The JSON-RPC version string this bridge speaks. */
export const JSONRPC_VERSION = '2.0';

/** Standard JSON-RPC 2.0 error codes. */
export const JsonRpcErrorCode = {
  /** The request was not valid JSON-RPC. */
  InvalidRequest: -32600,
  /** The method does not exist. */
  MethodNotFound: -32601,
  /** The method's parameters were invalid. */
  InvalidParams: -32602,
  /** An internal error occurred. */
  InternalError: -32603,
} as const;

/** A request id. JSON-RPC discourages null ids and MCP forbids them. */
export type JsonRpcId = string | number;

/** A JSON-RPC request or notification (a notification has no `id`). */
export interface JsonRpcRequest {
  /** Protocol version, always "2.0". */
  jsonrpc: typeof JSONRPC_VERSION;
  /** Request id; absent on a notification. Validate with {@link isValidRequestId}. */
  id?: unknown;
  /** The method to invoke. */
  method: string;
  /** Method parameters, if any. */
  params?: unknown;
}

/**
 * Type guard: is this an object that looks like a JSON-RPC request or
 * notification? Responses (no `method`) do not qualify, so a bridge never
 * answers a response and two bridges cannot ping-pong.
 * @param message Any inbound value.
 * @returns True when it has the right version and a string method.
 */
export function isJsonRpcRequest(message: unknown): message is JsonRpcRequest {
  return (
    !!message &&
    typeof message === 'object' &&
    (message as JsonRpcRequest).jsonrpc === JSONRPC_VERSION &&
    typeof (message as JsonRpcRequest).method === 'string'
  );
}

/**
 * Whether a request is a notification. JSON-RPC 2.0 section 4.1: "The Server
 * MUST NOT reply to a Notification".
 * @param message A JSON-RPC request.
 * @returns True when the request carries no id.
 */
export function isNotification(message: JsonRpcRequest): boolean {
  return message.id === undefined;
}

/**
 * Whether a request id is usable: a string or a finite number.
 * @param id The id from a request.
 * @returns True for a string or finite number id.
 */
export function isValidRequestId(id: unknown): id is JsonRpcId {
  return (
    typeof id === 'string' || (typeof id === 'number' && Number.isFinite(id))
  );
}

/**
 * Build a JSON-RPC success response.
 * @param id The id of the request being answered.
 * @param result The result payload.
 * @returns The response object.
 */
export function makeResponse(id: JsonRpcId, result: unknown) {
  return { jsonrpc: JSONRPC_VERSION, id, result };
}

/**
 * Build a JSON-RPC error response.
 * @param id The id of the request being answered, or null when it could not be determined.
 * @param code A {@link JsonRpcErrorCode}.
 * @param message A short description of the error.
 * @returns The error response object.
 */
export function makeError(id: JsonRpcId | null, code: number, message: string) {
  return { jsonrpc: JSONRPC_VERSION, id, error: { code, message } };
}

/**
 * Build a JSON-RPC notification (a message with no `id`, expecting no reply).
 * @param method The notification method.
 * @param params The notification payload.
 * @returns The notification object.
 */
export function makeNotification(method: string, params: unknown) {
  return { jsonrpc: JSONRPC_VERSION, method, params };
}
