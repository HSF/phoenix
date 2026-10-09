import type { AgentPeer, AgentTransport } from './agent-transport';
import { isOriginAllowed, type OriginRule } from './origin-policy';

/** The subset of `window` the transport needs (injectable for testing). */
export interface WindowLike {
  /**
   * Register an event listener (the transport listens for 'message').
   * @param type The event type.
   * @param listener The listener.
   */
  addEventListener(type: string, listener: (event: any) => void): void;
  /**
   * Remove a listener registered with addEventListener.
   * @param type The event type.
   * @param listener The listener.
   */
  removeEventListener(type: string, listener: (event: any) => void): void;
}

/** Options for {@link PostMessageTransport}. */
export interface PostMessageTransportOptions {
  /**
   * Who may drive Phoenix: exact origins, `'*'` (any concrete origin, only as a
   * deliberate app choice) or matchers such as {@link isLoopbackOrigin}. A
   * missing or empty list admits nobody, and the opaque `"null"` origin is
   * never admitted. See {@link isOriginAllowed}.
   */
  origins: OriginRule[];
  /** The window to listen on (defaults to the global window). */
  window?: WindowLike;
}

/** The window that sent a message, reduced to what a reply needs. */
interface MessageSource {
  /**
   * Deliver a message, only if the window is still at `targetOrigin`.
   * @param message The message.
   * @param targetOrigin The origin the window must have for delivery.
   */
  postMessage(message: unknown, targetOrigin: string): void;
  /** True once the window has been closed or removed. */
  closed?: boolean;
}

/**
 * An {@link AgentTransport} over `window.postMessage`, for driving Phoenix from
 * a parent page or an iframe embedder.
 *
 * Every inbound message is checked against the origin allowlist and dropped
 * silently (no reply) when it fails. An allowed message is delivered with a
 * peer for its sender window, and that peer posts back to that window alone
 * with the verified origin as `targetOrigin`, so the browser discards the reply
 * if the window has since navigated elsewhere. The transport keeps no list of
 * senders and has no broadcast: nobody is enrolled in anything by sending a
 * message.
 */
export class PostMessageTransport implements AgentTransport {
  /** The origin allowlist, copied so later changes to the caller's array cannot widen it. */
  private readonly origins: OriginRule[];
  /** The window listened on, if any. */
  private readonly win: WindowLike | undefined;
  /** The bound 'message' listener, kept so close() can remove it. */
  private readonly listener: (event: any) => void;
  /** The bridge's inbound handler; null before registration and after close. */
  private handler: ((message: unknown, peer: AgentPeer) => void) | null = null;
  /**
   * One peer per sender window, so a client keeps the same identity across its
   * messages. A WeakMap, so the transport never keeps a closed or removed
   * window alive.
   */
  private peers = new WeakMap<object, AgentPeer>();

  /**
   * Start listening for messages on the window.
   * @param options Allowlist and (optionally) the window to bind to.
   */
  constructor(options: PostMessageTransportOptions) {
    this.origins = Array.isArray(options?.origins) ? [...options.origins] : [];
    this.win =
      options?.window ??
      (typeof globalThis !== 'undefined'
        ? (globalThis as any).window
        : undefined);
    this.listener = (event: any) => this.onWindowMessage(event);
    this.win?.addEventListener('message', this.listener);
  }

  /**
   * Deliver an inbound window message when its origin is allowed and it has a
   * window to answer.
   * @param event The window's MessageEvent.
   */
  private onWindowMessage(event: any): void {
    const handler = this.handler;
    if (!handler) return;
    if (!isOriginAllowed(event?.origin, this.origins)) return;
    const source = event?.source as MessageSource | null | undefined;
    if (
      !source ||
      typeof source !== 'object' ||
      typeof source.postMessage !== 'function'
    ) {
      return;
    }
    handler(event.data, this.peerFor(source, event.origin));
  }

  /**
   * The peer for a sender window at a given origin. A window that navigated to
   * another origin gets a new peer addressed to the new origin.
   * @param source The sender window.
   * @param origin Its verified origin.
   * @returns The peer.
   */
  private peerFor(source: MessageSource, origin: string): AgentPeer {
    const known = this.peers.get(source);
    if (known && known.origin === origin) return known;
    const peer: AgentPeer = {
      origin,
      send: (message) => source.postMessage(message, origin),
      isClosed: () => source.closed === true,
    };
    this.peers.set(source, peer);
    return peer;
  }

  /**
   * Register the handler for allowed inbound messages.
   * @param cb Called with each message and the peer that sent it.
   */
  onMessage(cb: (message: unknown, peer: AgentPeer) => void): void {
    this.handler = cb;
  }

  /** Remove the window listener and forget every sender. */
  close(): void {
    this.win?.removeEventListener('message', this.listener);
    this.handler = null;
    this.peers = new WeakMap();
  }
}
