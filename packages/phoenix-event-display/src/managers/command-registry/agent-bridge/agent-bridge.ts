import type { CommandRegistry } from '../command-registry';
import { COMMAND_EXECUTED_EVENT } from '../command-registry';
import type { Command } from '../command.model';
import {
  resolveEnumSources,
  type EnumSourceHost,
  type ResolvedEnumSources,
} from '../enum-sources';
import { buildIntentSchema } from '../nl-intent';
import type { AgentPeer, AgentTransport } from './agent-transport';
import type { OriginRule } from './origin-policy';
import {
  PostMessageTransport,
  type WindowLike,
} from './post-message-transport';
import {
  JsonRpcErrorCode,
  isJsonRpcRequest,
  isNotification,
  isValidRequestId,
  makeError,
  makeNotification,
  makeResponse,
  type JsonRpcId,
} from './json-rpc';

/** Protocol version this bridge advertises in `initialize`. */
export const PHOENIX_AGENT_PROTOCOL_VERSION = '0.1';

/**
 * The slice of the event display the bridge needs: the command registry, the
 * event bus, and (optionally, via {@link EnumSourceHost}) the live values that
 * tools/list advertises as allowed arguments. Kept minimal so the bridge is
 * decoupled from the full EventDisplay and trivially testable.
 */
export interface AgentBridgeHost extends EnumSourceHost {
  /**
   * The command registry to expose.
   * @returns The registry.
   */
  getCommandRegistry(): CommandRegistry;
  /**
   * Subscribe to a bus event.
   * @param eventName The event name.
   * @param callback Called with the event data.
   * @returns An unsubscribe function.
   */
  on(eventName: string, callback: (data: any) => void): () => void;
}

/** Options for {@link createAgentBridge}. */
export interface AgentBridgeOptions {
  /**
   * The transport to communicate over. When omitted, a
   * {@link PostMessageTransport} is created from `origins` (and `window`).
   */
  transport?: AgentTransport;
  /**
   * Origin allowlist for the default postMessage transport (ignored if a
   * transport is given). Missing or empty admits nobody.
   */
  origins?: OriginRule[];
  /** Window for the default postMessage transport (defaults to the global window). */
  window?: WindowLike;
  /**
   * Whether the agent may run view-changing (mutating) commands. Default true;
   * false restricts it to read-only queries (`mutates: false`).
   */
  allowMutations?: boolean;
}

/** A running bridge. */
export interface AgentBridgeHandle {
  /** Stop forwarding events, forget every client, and close the transport. */
  dispose(): void;
  /**
   * Re-attach the `phoenix/event` subscription to the event bus.
   *
   * `EventDisplay.init()` clears every bus subscriber when a view is
   * re-initialised (each route change in the Phoenix app), which silently stops
   * the event stream of a bridge that outlives the view. A host that
   * re-initialises the display calls this afterwards; a client sending
   * `initialize` again does the same. Idempotent (never stacks listeners) and
   * inert after dispose().
   */
  resubscribe(): void;
}

/**
 * A command's input schema as plain JSON Schema for MCP clients: `enumSource`
 * resolved into a concrete `enum` from the live display (or dropped when that
 * source is empty), so every emitted keyword is standard.
 *
 * The conversion is the natural-language layer's own (`toArgsSchema`, reached
 * through the exported `buildIntentSchema` for a single tool), so tools/list
 * and the model's grammar cannot disagree about which values are allowed.
 * @param command The registered command.
 * @param enums Live values for every enum source.
 * @returns A JSON Schema object for the command's arguments.
 */
function toToolInputSchema(
  command: Command,
  enums: ResolvedEnumSources,
): object {
  const schema = JSON.parse(buildIntentSchema([command], enums));
  return schema.oneOf[0].properties.args;
}

/**
 * Expose a Phoenix command registry to external clients over a transport,
 * using JSON-RPC 2.0 with MCP-style method names (`initialize`, `tools/list`,
 * `tools/call`).
 *
 * Addressing: every response goes only to the client that made the request.
 * Every command that runs (from here, the palette, or the natural-language
 * layer) is streamed as a `phoenix/event` notification, and only to clients
 * that completed `initialize`. Notifications (requests without an id) are
 * never answered and never run anything.
 *
 * Physics-safe by construction: calls go through the same `registry.execute`
 * path as the rest of Phoenix, so only registered, schema-validated commands
 * can ever run.
 *
 * @param host The event display (command registry + event bus).
 * @param options Transport and policy.
 * @returns A handle to dispose the bridge or re-attach its event stream.
 */
export function createAgentBridge(
  host: AgentBridgeHost,
  options: AgentBridgeOptions,
): AgentBridgeHandle {
  const registry = host.getCommandRegistry();
  const transport =
    options?.transport ??
    new PostMessageTransport({
      origins: options?.origins ?? [],
      window: options?.window,
    });
  const allowMutations = options?.allowMutations !== false;
  // Clients that completed initialize: the only ones sent phoenix/event.
  const subscribers = new Set<AgentPeer>();
  let disposed = false;
  let unsubscribe: () => void = () => undefined;

  const forwardEvent = (data: unknown): void => {
    if (subscribers.size === 0) return;
    const notification = makeNotification('phoenix/event', data);
    for (const peer of [...subscribers]) {
      if (peer.isClosed()) {
        subscribers.delete(peer);
        continue;
      }
      try {
        peer.send(notification);
      } catch {
        // This runs inside registry.execute: a client that cannot receive this
        // payload must neither fail the command nor starve the other clients.
      }
    }
  };

  const resubscribe = (): void => {
    if (disposed) return;
    unsubscribe();
    unsubscribe = host.on(COMMAND_EXECUTED_EVENT, forwardEvent);
  };
  resubscribe();

  transport.onMessage((message, peer) => handleMessage(message, peer));

  /** Send a response to one client; report an undeliverable result instead of hanging. */
  function reply(peer: AgentPeer, id: JsonRpcId | null, message: object): void {
    if (disposed) return;
    try {
      peer.send(message);
    } catch {
      // For example a DataCloneError: a result structured clone cannot copy.
      try {
        peer.send(
          makeError(
            id,
            JsonRpcErrorCode.InternalError,
            'The result could not be delivered to this client.',
          ),
        );
      } catch {
        // The client is unreachable.
      }
    }
  }

  /** Route one inbound message from one client. */
  function handleMessage(message: unknown, peer: AgentPeer): void {
    if (disposed || !peer || !isJsonRpcRequest(message)) return;
    // JSON-RPC 2.0 section 4.1: never reply to a notification. MCP defines
    // every method served here as a request, so nothing runs either.
    if (isNotification(message)) return;
    const { id, method, params } = message;
    if (!isValidRequestId(id)) {
      reply(
        peer,
        null,
        makeError(
          null,
          JsonRpcErrorCode.InvalidRequest,
          'Request id must be a string or a finite number.',
        ),
      );
      return;
    }
    switch (method) {
      case 'initialize':
        subscribers.add(peer);
        resubscribe();
        reply(
          peer,
          id,
          makeResponse(id, {
            protocolVersion: PHOENIX_AGENT_PROTOCOL_VERSION,
            serverInfo: {
              name: 'phoenix',
              version: PHOENIX_AGENT_PROTOCOL_VERSION,
            },
            capabilities: { tools: {} },
            toolCount: registry.list().length,
          }),
        );
        return;
      case 'tools/list':
        reply(peer, id, makeResponse(id, { tools: listTools() }));
        return;
      case 'tools/call':
        handleToolCall(peer, id, params).catch((e) =>
          reply(
            peer,
            id,
            makeError(
              id,
              JsonRpcErrorCode.InternalError,
              String(e?.message ?? e),
            ),
          ),
        );
        return;
      default:
        reply(
          peer,
          id,
          makeError(
            id,
            JsonRpcErrorCode.MethodNotFound,
            `Unknown method: ${method}`,
          ),
        );
    }
  }

  /** The registered commands as MCP tools with live enums, each tagged with `mutates`. */
  function listTools() {
    const enums = resolveEnumSources(host);
    return registry.list().map((command) => ({
      name: command.name,
      description: command.description,
      inputSchema: toToolInputSchema(command, enums),
      mutates: command.mutates,
    }));
  }

  /** Validate, apply policy, execute, and reply to the caller for a `tools/call`. */
  async function handleToolCall(
    peer: AgentPeer,
    id: JsonRpcId,
    params: unknown,
  ): Promise<void> {
    const name = (params as { name?: unknown })?.name;
    if (typeof name !== 'string') {
      reply(
        peer,
        id,
        makeError(
          id,
          JsonRpcErrorCode.InvalidParams,
          'tools/call requires a tool name',
        ),
      );
      return;
    }
    const command = registry.get(name);
    if (!command) {
      reply(
        peer,
        id,
        makeError(id, JsonRpcErrorCode.InvalidParams, `Unknown tool: ${name}`),
      );
      return;
    }
    if (!allowMutations && command.mutates) {
      reply(
        peer,
        id,
        makeResponse(id, {
          isError: true,
          content: [
            { type: 'text', text: 'View changes are disabled for this agent.' },
          ],
        }),
      );
      return;
    }
    const args =
      (params as { arguments?: Record<string, any> }).arguments ?? {};
    const result = await registry.execute(name, args);
    if (result.ok) {
      reply(
        peer,
        id,
        makeResponse(id, {
          isError: false,
          content: [{ type: 'text', text: `${name} ok` }],
          structuredContent: result.result,
        }),
      );
    } else {
      // This workspace compiles without strictNullChecks, so the ok:false
      // branch does not narrow the CommandResult union; read the error off the
      // explicitly-typed failure variant.
      const failure = result as { ok: false; error: string };
      reply(
        peer,
        id,
        makeResponse(id, {
          isError: true,
          content: [{ type: 'text', text: failure.error }],
        }),
      );
    }
  }

  return {
    dispose(): void {
      disposed = true;
      unsubscribe();
      unsubscribe = () => undefined;
      subscribers.clear();
      transport.close();
    },
    resubscribe,
  };
}
