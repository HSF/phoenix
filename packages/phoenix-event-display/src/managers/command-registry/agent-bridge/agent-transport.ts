/**
 * One client of the agent bridge, as authenticated and addressed by a
 * transport. A transport hands the bridge a peer with every inbound message and
 * the bridge answers through that same peer, so a reply can only ever reach the
 * client that asked.
 */
export interface AgentPeer {
  /** The client's origin, as verified by the transport. */
  readonly origin: string;

  /**
   * Send one JSON-RPC message to this client only.
   * @param message A JSON-RPC response or notification object.
   */
  send(message: object): void;

  /**
   * Whether the client can no longer receive messages (its window closed).
   * @returns True once the client is gone.
   */
  isClosed(): boolean;
}

/**
 * A message channel between the agent bridge ({@link createAgentBridge}) and
 * its clients (parent pages over postMessage, or any other channel). The bridge
 * is written against this interface alone, so it never depends on how messages
 * travel and can be unit-tested with a mock transport.
 *
 * Division of work: a transport authenticates senders and addresses replies to
 * them, and never broadcasts. Session state (which clients completed
 * `initialize` and therefore receive the `phoenix/event` stream) belongs to the
 * bridge.
 */
export interface AgentTransport {
  /**
   * Register the handler for inbound messages. The transport delivers only
   * messages the bridge should trust (a postMessage transport enforces its
   * origin allowlist first) and only when it can address a reply.
   * @param cb Called with each inbound message and the peer that sent it.
   */
  onMessage(cb: (message: unknown, peer: AgentPeer) => void): void;

  /** Tear down the channel (remove listeners, forget clients). */
  close(): void;
}
