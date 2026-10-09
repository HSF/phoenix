/**
 * @jest-environment jsdom
 */
import { EventDisplay } from '../../../event-display';
import { CommandRegistry } from '../../../managers/command-registry/command-registry';
import { registerDefaultCommands } from '../../../managers/command-registry/default-commands';
import type { CommandHost } from '../../../managers/command-registry/command-host';
import {
  createAgentBridge,
  isLoopbackOrigin,
  type AgentPeer,
  type AgentTransport,
} from '../../../managers/command-registry/agent-bridge';

/** One client as the bridge sees it: records what is sent to it. */
class MockPeer implements AgentPeer {
  sent: any[] = [];
  closed = false;
  throwOnSend = false;
  failNextSend = false;
  constructor(public readonly origin = 'https://ok') {}
  send(message: object): void {
    if (this.throwOnSend) throw new Error('DataCloneError');
    if (this.failNextSend) {
      this.failNextSend = false;
      throw new Error('DataCloneError');
    }
    this.sent.push(message);
  }
  isClosed(): boolean {
    return this.closed;
  }
  last(): any {
    return this.sent[this.sent.length - 1];
  }
  events(): any[] {
    return this.sent.filter((m) => m?.method === 'phoenix/event');
  }
  replies(): any[] {
    return this.sent.filter((m) => m?.method !== 'phoenix/event');
  }
}

/** A transport a test can drive by injecting messages from given peers. */
class MockTransport implements AgentTransport {
  closed = false;
  private handler: ((msg: unknown, peer: AgentPeer) => void) | null = null;
  onMessage(cb: (msg: unknown, peer: AgentPeer) => void): void {
    this.handler = cb;
  }
  close(): void {
    this.closed = true;
  }
  receive(msg: unknown, peer: AgentPeer): void {
    this.handler?.(msg, peer);
  }
}

/**
 * A fake EventDisplay with a real mini event bus, wired as production: the
 * command host's `emit` routes to the same bus `on` subscribes to.
 */
function makeEventDisplay(live: any = {}) {
  let listeners: Record<string, ((data: any) => void)[]> = {};
  const emit = (name: string, data?: any) =>
    (listeners[name] ?? []).forEach((cb) => cb(data));
  const on = (name: string, cb: (data: any) => void) => {
    (listeners[name] ??= []).push(cb);
    return () => {
      listeners[name] = (listeners[name] ?? []).filter((c) => c !== cb);
    };
  };
  const calls = {
    setDarkTheme: jest.fn(),
    nextEvent: jest.fn(),
  };
  const host: CommandHost = {
    eventDisplay: {
      nextEvent: calls.nextEvent,
      highlightObject: jest.fn(),
      getCollections: () => ({ Tracks: [{ uuid: 'u0' }] }),
      getCurrentEventKey: () => 'e1',
      getEventMetadata: () => [{}],
    },
    ui: { setDarkTheme: calls.setDarkTheme, setShowAxis: jest.fn() },
    three: {},
    state: {},
    emit,
    resolveObject: (_c: string, i: number) =>
      i === 0 ? { uuid: 'u0' } : undefined,
    listGeometryParts: () => [],
  } as unknown as CommandHost;
  const registry = new CommandRegistry(host);
  registerDefaultCommands(registry);
  const eventDisplay = {
    getCommandRegistry: () => registry,
    on,
    emit,
    ...live,
  };
  return {
    eventDisplay,
    registry,
    calls,
    clearBus: () => (listeners = {}),
    listenerCount: (name: string) => (listeners[name] ?? []).length,
  };
}

function setup(options: any = {}, live: any = {}) {
  const made = makeEventDisplay(live);
  const transport = new MockTransport();
  const bridge = createAgentBridge(made.eventDisplay as any, {
    transport,
    ...options,
  });
  const peer = new MockPeer();
  return { ...made, bridge, transport, peer };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

const req = (id: any, method: string, params?: any) => ({
  jsonrpc: '2.0',
  id,
  method,
  ...(params ? { params } : {}),
});

const note = (method: string, params?: any) => ({
  jsonrpc: '2.0',
  method,
  ...(params ? { params } : {}),
});

describe('AgentBridge: initialize + tools/list', () => {
  it('answers initialize with server info and the tool count', () => {
    const { transport, registry, peer } = setup();
    transport.receive(req(1, 'initialize'), peer);
    const res = peer.last();
    expect(res.id).toBe(1);
    expect(res.result.serverInfo.name).toBe('phoenix');
    expect(res.result.capabilities.tools).toBeDefined();
    expect(res.result.toolCount).toBe(registry.list().length);
  });

  it('answers tools/list with every registered tool, each tagged with mutates', () => {
    const { transport, registry, peer } = setup();
    transport.receive(req(2, 'tools/list'), peer);
    const tools = peer.last().result.tools;
    expect(tools.length).toBe(registry.list().length);
    expect(tools.find((t: any) => t.name === 'set-theme').mutates).toBe(true);
    expect(tools.find((t: any) => t.name === 'list-collections').mutates).toBe(
      false,
    );
  });
});

describe('AgentBridge: tools/list schemas are valid JSON Schema with live enums', () => {
  const live = {
    getCollections: () => ({
      Tracks: ['CombinedInDetTracks'],
      Jets: ['AntiKt4EMTopoJets'],
    }),
    getUIManager: () => ({
      getPresetViews: () => [{ name: 'Left View' }, { name: 'Right View' }],
    }),
    getEventsData: () => ({ e1: {}, e2: {} }),
    getGeometryPartNames: () => ['Pixel', 'SCT'],
  };

  function toolsFor(liveValues: any) {
    const { transport, peer } = setup({}, liveValues);
    transport.receive(req(1, 'tools/list'), peer);
    return peer.last().result.tools as any[];
  }

  /** Every property of every tool that uses the given parameter name. */
  const propsNamed = (tools: any[], name: string) =>
    tools
      .map((t) => t.inputSchema.properties?.[name])
      .filter((p) => p !== undefined);

  it('never emits the non-JSON-Schema enumSource keyword', () => {
    for (const tool of toolsFor(live)) {
      expect(JSON.stringify(tool.inputSchema)).not.toContain('enumSource');
      expect(tool.inputSchema.type).toBe('object');
    }
  });

  it('pins collection, view, eventKey and part to the live values', () => {
    const tools = toolsFor(live);
    const expectations: Record<string, string[]> = {
      collection: ['CombinedInDetTracks', 'AntiKt4EMTopoJets'],
      view: ['Left View', 'Right View'],
      eventKey: ['e1', 'e2'],
      part: ['Pixel', 'SCT'],
    };
    for (const [param, values] of Object.entries(expectations)) {
      const props = propsNamed(tools, param);
      expect(props.length).toBeGreaterThan(0);
      for (const prop of props) expect(prop.enum).toEqual(values);
    }
  });

  it('leaves a parameter as a plain typed field when its live source is empty', () => {
    const tools = toolsFor({});
    for (const param of ['collection', 'view', 'eventKey', 'part']) {
      for (const prop of propsNamed(tools, param)) {
        expect(prop.enum).toBeUndefined();
        expect(prop.type).toBe('string');
      }
    }
  });

  it('still answers tools/list while the display is not ready', () => {
    const tools = toolsFor({
      getCollections: () => {
        throw new TypeError('configuration is undefined');
      },
    });
    expect(tools.length).toBeGreaterThan(0);
  });
});

describe('AgentBridge: tools/call', () => {
  it('runs a command through the registry and reports success', async () => {
    const { transport, calls, peer } = setup();
    transport.receive(
      req(3, 'tools/call', { name: 'set-theme', arguments: { dark: true } }),
      peer,
    );
    await flush();
    expect(peer.last().id).toBe(3);
    expect(peer.last().result.isError).toBe(false);
    expect(calls.setDarkTheme).toHaveBeenCalledWith(true);
  });

  it('returns structuredContent for a query command', async () => {
    const { transport, peer } = setup();
    transport.receive(req(4, 'tools/call', { name: 'list-collections' }), peer);
    await flush();
    expect(peer.last().result.structuredContent).toEqual({
      Tracks: [{ uuid: 'u0' }],
    });
  });

  it('reports a runtime command failure as isError (never throws)', async () => {
    const { transport, peer } = setup();
    transport.receive(
      req(5, 'tools/call', {
        name: 'highlight-object',
        arguments: { collection: 'Tracks', index: 9 },
      }),
      peer,
    );
    await flush();
    expect(peer.last().result.isError).toBe(true);
    expect(peer.last().result.content[0].text).toContain('no object');
  });

  it('accepts falsy but valid ids (0 and the empty string)', async () => {
    const { transport, peer } = setup();
    transport.receive(req(0, 'tools/list'), peer);
    transport.receive(req('', 'initialize'), peer);
    expect(peer.replies().map((r) => r.id)).toEqual([0, '']);
  });

  it('turns a result the peer cannot receive into a -32603 error for that peer', async () => {
    const { transport, peer } = setup();
    transport.receive(req(6, 'tools/call', { name: 'list-collections' }), peer);
    peer.failNextSend = true;
    await flush();
    // The first send threw (e.g. DataCloneError); the client must not hang.
    expect(peer.last().id).toBe(6);
    expect(peer.last().error.code).toBe(-32603);
  });
});

describe('AgentBridge: JSON-RPC errors', () => {
  it('returns -32601 for an unknown method', () => {
    const { transport, peer } = setup();
    transport.receive(req(6, 'nonsense/method'), peer);
    expect(peer.last().error.code).toBe(-32601);
  });

  it('returns -32602 for an unknown tool name', async () => {
    const { transport, peer } = setup();
    transport.receive(req(7, 'tools/call', { name: 'launch-rockets' }), peer);
    await flush();
    expect(peer.last().error.code).toBe(-32602);
  });

  it('returns -32602 when tools/call has no name', () => {
    const { transport, peer } = setup();
    transport.receive(req(8, 'tools/call', {}), peer);
    expect(peer.last().error.code).toBe(-32602);
  });

  it('ignores a non-JSON-RPC message without replying or throwing', () => {
    const { transport, peer } = setup();
    expect(() => transport.receive({ hello: 'world' }, peer)).not.toThrow();
    expect(() => transport.receive('not even an object', peer)).not.toThrow();
    expect(() => transport.receive(null, peer)).not.toThrow();
    // a JSON-RPC response (no method) must never be answered: no ping-pong
    transport.receive({ jsonrpc: '2.0', id: 1, result: {} }, peer);
    expect(peer.sent).toHaveLength(0);
  });

  it('answers a request whose id is not a string or number with -32600 and a null id', () => {
    const { transport, peer } = setup();
    for (const id of [null, { x: 1 }, true, Infinity]) {
      transport.receive(req(id, 'tools/list'), peer);
    }
    expect(peer.sent).toHaveLength(4);
    for (const res of peer.sent) {
      expect(res.id).toBeNull();
      expect(res.error.code).toBe(-32600);
    }
  });
});

describe('AgentBridge: notifications get no reply (JSON-RPC 2.0 section 4.1)', () => {
  it('never replies to a notification, for known or unknown methods', () => {
    const { transport, peer } = setup();
    transport.receive(note('notifications/initialized'), peer);
    transport.receive(note('tools/list'), peer);
    transport.receive(note('initialize'), peer);
    transport.receive(note('nonsense/method'), peer);
    transport.receive(
      { jsonrpc: '2.0', id: undefined, method: 'tools/list' },
      peer,
    );
    expect(peer.sent).toHaveLength(0);
  });

  it('a tools/call sent as a notification runs nothing', async () => {
    const { transport, calls, peer } = setup();
    transport.receive(
      note('tools/call', { name: 'set-theme', arguments: { dark: true } }),
      peer,
    );
    await flush();
    expect(calls.setDarkTheme).not.toHaveBeenCalled();
    expect(peer.sent).toHaveLength(0);
  });

  it('an initialize sent as a notification does not subscribe to events', async () => {
    const { transport, registry, peer } = setup();
    transport.receive(note('initialize'), peer);
    await registry.execute('set-theme', { dark: true });
    expect(peer.sent).toHaveLength(0);
  });
});

describe('AgentBridge: replies and events are addressed per client', () => {
  it('a response goes only to the client that asked, even when two clients reuse an id', () => {
    const { transport } = setup();
    const a = new MockPeer('https://a');
    const b = new MockPeer('https://b');
    transport.receive(req(1, 'initialize'), a);
    transport.receive(req(1, 'tools/list'), b);
    expect(a.replies()).toHaveLength(1);
    expect(a.last().result.serverInfo).toBeDefined();
    expect(b.replies()).toHaveLength(1);
    expect(b.last().result.tools).toBeDefined();
  });

  it('streams phoenix/event only to clients that completed initialize', async () => {
    const { transport, registry } = setup();
    const initialized = new MockPeer('https://a');
    const junk = new MockPeer('https://b');
    const listOnly = new MockPeer('https://c');
    transport.receive(req(1, 'initialize'), initialized);
    transport.receive({ hello: 'world' }, junk);
    transport.receive(req(1, 'tools/list'), listOnly);
    await registry.execute('set-theme', { dark: true });

    expect(initialized.events()).toHaveLength(1);
    expect(initialized.events()[0].params.name).toBe('set-theme');
    expect(initialized.events()[0].params.args).toEqual({ dark: true });
    expect(initialized.events()[0].id).toBeUndefined();
    expect(junk.sent).toHaveLength(0);
    expect(listOnly.events()).toHaveLength(0);
  });

  it('an unanswered tools/call from another client does not leak its result to the initialized client', async () => {
    const { transport } = setup();
    const watcher = new MockPeer('https://a');
    const caller = new MockPeer('https://b');
    transport.receive(req(1, 'initialize'), watcher);
    transport.receive(
      req(9, 'tools/call', { name: 'list-collections' }),
      caller,
    );
    await flush();
    // The watcher sees the phoenix/event notification, never the response.
    expect(watcher.replies().map((r) => r.id)).toEqual([1]);
    expect(caller.last().id).toBe(9);
  });

  it('initializing twice does not duplicate events', async () => {
    const { transport, registry, peer } = setup();
    transport.receive(req(1, 'initialize'), peer);
    transport.receive(req(2, 'initialize'), peer);
    await registry.execute('set-theme', { dark: true });
    expect(peer.events()).toHaveLength(1);
  });

  it('drops a client whose window has closed', async () => {
    const { transport, registry, peer } = setup();
    transport.receive(req(1, 'initialize'), peer);
    peer.closed = true;
    const before = peer.sent.length;
    await registry.execute('set-theme', { dark: true });
    peer.closed = false;
    await registry.execute('set-theme', { dark: false });
    expect(peer.sent.length).toBe(before);
  });

  it('a client that fails to receive does not stop events reaching the others', async () => {
    const { transport, registry } = setup();
    const broken = new MockPeer('https://a');
    const healthy = new MockPeer('https://b');
    transport.receive(req(1, 'initialize'), broken);
    transport.receive(req(1, 'initialize'), healthy);
    broken.throwOnSend = true;
    await expect(
      registry.execute('set-theme', { dark: true }),
    ).resolves.toMatchObject({ ok: true });
    expect(healthy.events()).toHaveLength(1);
  });
});

describe('AgentBridge: mutation policy', () => {
  it('refuses a mutating command when allowMutations is false', async () => {
    const { transport, calls, peer } = setup({ allowMutations: false });
    transport.receive(
      req(9, 'tools/call', { name: 'set-theme', arguments: { dark: true } }),
      peer,
    );
    await flush();
    expect(peer.last().result.isError).toBe(true);
    expect(calls.setDarkTheme).not.toHaveBeenCalled();
  });

  it('still allows a read-only command when allowMutations is false', async () => {
    const { transport, peer } = setup({ allowMutations: false });
    transport.receive(
      req(10, 'tools/call', { name: 'list-collections' }),
      peer,
    );
    await flush();
    expect(peer.last().result.isError).toBe(false);
  });
});

describe('AgentBridge: surviving a view re-initialisation', () => {
  /** A real EventDisplay (prototype) with just enough state to run cleanup(). */
  function realDisplay(): EventDisplay {
    const ed = Object.create(EventDisplay.prototype) as EventDisplay;
    Object.assign(ed as any, {
      eventBus: new Map(),
      eventBusWildcard: new Set(),
      onEventsChange: [],
      onDisplayedEventChange: [],
      commandRegistry: null,
      graphicsLibrary: { cleanup: jest.fn() },
      ui: { cleanup: jest.fn() },
      stateManager: { resetForViewTransition: jest.fn() },
      nextEvent: jest.fn(),
    });
    return ed;
  }

  it('EventDisplay.cleanup() (run by every re-init) drops the stream; resubscribe() restores exactly one listener', async () => {
    const ed = realDisplay();
    const transport = new MockTransport();
    const bridge = createAgentBridge(ed, { transport });
    const peer = new MockPeer();
    transport.receive(req(1, 'initialize'), peer);

    ed.cleanup();
    await ed.getCommandRegistry().execute('next-event');
    expect(peer.events()).toHaveLength(0); // the root cause, pinned

    bridge.resubscribe();
    bridge.resubscribe();
    bridge.resubscribe();
    await ed.getCommandRegistry().execute('next-event');
    expect(peer.events()).toHaveLength(1);
  });

  it('a client re-sending initialize after a view change re-arms the stream', async () => {
    const ed = realDisplay();
    const transport = new MockTransport();
    createAgentBridge(ed, { transport });
    const peer = new MockPeer();
    transport.receive(req(1, 'initialize'), peer);
    ed.cleanup();
    transport.receive(req(2, 'initialize'), peer);
    await ed.getCommandRegistry().execute('next-event');
    expect(peer.events()).toHaveLength(1);
  });

  it('resubscribe() never stacks listeners on a bus that was not cleared', () => {
    const { bridge, listenerCount } = setup();
    bridge.resubscribe();
    bridge.resubscribe();
    expect(listenerCount('command-executed')).toBe(1);
  });
});

/** A window stand-in for the default-transport tests. */
function fakeWindow() {
  const listeners: Record<string, ((e: any) => void)[]> = {};
  return {
    addEventListener: (t: string, cb: any) => (listeners[t] ??= []).push(cb),
    removeEventListener: (t: string, cb: any) =>
      (listeners[t] = (listeners[t] ?? []).filter((c) => c !== cb)),
    dispatch: (t: string, e: any) =>
      (listeners[t] ?? []).forEach((cb) => cb(e)),
  };
}

function fakeSource() {
  return {
    posted: [] as { m: any; o: string }[],
    closed: false,
    postMessage(m: any, o: string) {
      this.posted.push({ m, o });
    },
  };
}

describe('AgentBridge: default PostMessage transport', () => {
  it('listens on the window and replies to an allowed origin, addressed to it', () => {
    const { eventDisplay } = makeEventDisplay();
    const win = fakeWindow();
    const source = fakeSource();
    createAgentBridge(eventDisplay as any, {
      origins: ['https://ok'],
      window: win as any,
    });
    win.dispatch('message', {
      data: req(1, 'tools/list'),
      origin: 'https://ok',
      source,
    });
    expect(source.posted[0].m.id).toBe(1);
    expect(source.posted[0].o).toBe('https://ok');
  });

  it('drops a message from a disallowed origin (no reply)', () => {
    const { eventDisplay } = makeEventDisplay();
    const win = fakeWindow();
    const source = fakeSource();
    createAgentBridge(eventDisplay as any, {
      origins: ['https://ok'],
      window: win as any,
    });
    win.dispatch('message', {
      data: req(1, 'tools/list'),
      origin: 'https://evil',
      source,
    });
    expect(source.posted).toHaveLength(0);
  });

  it('end to end: a junk message from one window never enrolls it in another client session', async () => {
    const { eventDisplay, registry } = makeEventDisplay();
    const win = fakeWindow();
    createAgentBridge(eventDisplay as any, {
      origins: [isLoopbackOrigin],
      window: win as any,
    });
    const client = fakeSource();
    const snoop = fakeSource();
    const send = (data: any, origin: string, source: any) =>
      win.dispatch('message', { data, origin, source });

    send(req(1, 'initialize'), 'http://localhost:4321', client);
    send({ hello: 'from the snoop' }, 'http://localhost:5555', snoop);
    send(req(1, 'tools/list'), 'http://localhost:5555', snoop);
    send(
      req(2, 'tools/call', { name: 'set-theme', arguments: { dark: true } }),
      'http://localhost:4321',
      client,
    );
    await flush();

    // The snoop gets its own tools/list answer and nothing else.
    expect(snoop.posted.map((p) => p.m.id)).toEqual([1]);
    expect(snoop.posted[0].m.result.tools).toBeDefined();
    // The client gets its two replies plus the event for its own call.
    expect(client.posted.some((p) => p.m.method === 'phoenix/event')).toBe(
      true,
    );
    expect(client.posted.every((p) => p.o === 'http://localhost:4321')).toBe(
      true,
    );
    await registry.execute('set-theme', { dark: false });
    expect(snoop.posted).toHaveLength(1);
  });
});

describe('AgentBridge: lifecycle', () => {
  it('dispose() stops event forwarding and closes the transport', async () => {
    const { bridge, transport, registry, peer } = setup();
    transport.receive(req(1, 'initialize'), peer);
    bridge.dispose();
    expect(transport.closed).toBe(true);
    await registry.execute('set-theme', { dark: true });
    expect(peer.events()).toHaveLength(0);
  });

  it('sends no reply for a call that finishes after dispose()', async () => {
    const { bridge, transport, peer } = setup();
    transport.receive(req(1, 'tools/call', { name: 'list-collections' }), peer);
    bridge.dispose();
    await flush();
    expect(peer.sent).toHaveLength(0);
  });

  it('resubscribe() after dispose() does not bring the stream back', async () => {
    const { bridge, transport, registry, peer, listenerCount } = setup();
    transport.receive(req(1, 'initialize'), peer);
    bridge.dispose();
    bridge.resubscribe();
    expect(listenerCount('command-executed')).toBe(0);
    await registry.execute('set-theme', { dark: true });
    expect(peer.events()).toHaveLength(0);
  });
});
