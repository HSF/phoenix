import { TestBed } from '@angular/core/testing';
import { ApplicationRef } from '@angular/core';
import { CommandRegistry } from 'phoenix-event-display';
import {
  AgentBridgeService,
  provideAgentBridge,
  resolveAgentBridgeOrigins,
} from './agent-bridge.service';
import { EventDisplayService } from './event-display.service';

/**
 * The `?agent=1` URL switch is a DEMO/dev convenience. It must only ever enable
 * the bridge on the loopback host, and even there only for loopback origins:
 * any page on the web can iframe a running dev server with `?agent=1` appended,
 * which the developer never opted into, and `get-object` hands back loaded
 * event data. Production deployments enable the bridge via explicit config
 * origins. These tests pin that boundary.
 */

/** A stand-in event display with a real registry and a clearable event bus. */
function fakeEventDisplay() {
  let listeners: Record<string, ((data: any) => void)[]> = {};
  const emit = (name: string, data?: any) =>
    (listeners[name] ?? []).forEach((cb) => cb(data));
  const on = (name: string, cb: (data: any) => void) => {
    (listeners[name] ??= []).push(cb);
    return () => {
      listeners[name] = (listeners[name] ?? []).filter((c) => c !== cb);
    };
  };
  const registry = new CommandRegistry({ emit } as any);
  registry.register({
    name: 'ping',
    title: 'Ping',
    description: 'A command used by the tests.',
    category: 'Test',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false,
    },
    mutates: false,
    run: () => 'pong',
  });
  return {
    getCommandRegistry: () => registry,
    on,
    emit,
    registry,
    /** What EventDisplay.init() does to the bus on every route change. */
    reinitialise: () => {
      listeners = {};
    },
    listenerCount: (name: string) => (listeners[name] ?? []).length,
  };
}

/** A client window that records what Phoenix posts back to it. */
class FakeClient {
  posted: { msg: any; origin: string }[] = [];
  closed = false;
  postMessage(msg: any, origin: string): void {
    this.posted.push({ msg, origin });
  }
}

/** Deliver a cross-window message to the real jsdom window. */
function deliver(data: any, origin: string, source: any): void {
  const event = new Event('message');
  Object.defineProperties(event, {
    data: { value: data },
    origin: { value: origin },
    source: { value: source },
  });
  window.dispatchEvent(event);
}

const initialize = { jsonrpc: '2.0', id: 1, method: 'initialize' };

/** Count the 'message' listeners the bridge installs on the real window. */
function trackMessageListeners() {
  const live = new Set<any>();
  const add = window.addEventListener.bind(window);
  const remove = window.removeEventListener.bind(window);
  jest
    .spyOn(window, 'addEventListener')
    .mockImplementation((type: any, cb: any, opts?: any) => {
      if (type === 'message') live.add(cb);
      return add(type, cb, opts);
    });
  jest
    .spyOn(window, 'removeEventListener')
    .mockImplementation((type: any, cb: any, opts?: any) => {
      if (type === 'message') live.delete(cb);
      return remove(type, cb, opts);
    });
  return { count: () => live.size };
}

function makeService(display: any = fakeEventDisplay()) {
  TestBed.configureTestingModule({
    providers: [{ provide: EventDisplayService, useValue: display }],
  });
  const service = TestBed.inject(AgentBridgeService);
  return { service, display };
}

/** Run a render pass so afterEveryRender hooks fire. */
function render(): void {
  TestBed.inject(ApplicationRef).tick();
}

afterEach(() => jest.restoreAllMocks());

describe('resolveAgentBridgeOrigins', () => {
  const admits = (rules: any, origin: string) =>
    rules.some((rule: any) => typeof rule === 'function' && rule(origin));

  it('enables for ?agent=1 on a loopback host, for loopback origins only', () => {
    for (const host of ['localhost', '127.0.0.1', '[::1]']) {
      const rules = resolveAgentBridgeOrigins('agent=1', host);
      expect(rules).not.toBeNull();
      expect(rules).not.toContain('*');
      expect(admits(rules, 'http://localhost:4200')).toBe(true);
      expect(admits(rules, 'https://localhost:8443')).toBe(true);
      for (const origin of [
        'http://localhost.evil.com',
        'http://127.0.0.2',
        'null',
        'file://',
        'https://evil.com',
      ]) {
        expect(admits(rules, origin)).toBe(false);
      }
    }
  });

  it('reads agent=1 even alongside other params', () => {
    expect(
      resolveAgentBridgeOrigins('file=x&type=json&agent=1', 'localhost'),
    ).not.toBeNull();
  });

  it('does NOT enable via the URL on a production host (config-only there)', () => {
    expect(
      resolveAgentBridgeOrigins('agent=1', 'phoenix.example.org'),
    ).toBeNull();
    expect(resolveAgentBridgeOrigins('agent=1', 'hsf.github.io')).toBeNull();
  });

  it('does nothing without agent=1', () => {
    for (const query of ['', 'file=x', 'agent=0', 'agent=true', 'agent=01']) {
      expect(resolveAgentBridgeOrigins(query, 'localhost')).toBeNull();
    }
  });

  it('stays dormant when the switch is given twice with different values', () => {
    expect(
      resolveAgentBridgeOrigins('agent=1&agent=0', 'localhost'),
    ).toBeNull();
  });
});

describe('AgentBridgeService.enableFromLocation', () => {
  it('enables from a normal search string (the app uses path routing)', () => {
    const { service, display } = makeService();
    service.enableFromLocation(display, {
      search: '?agent=1',
      hostname: 'localhost',
    });
    expect(service.isEnabled).toBe(true);
  });

  it('enables from a query inside the hash (hash-routed embedders)', () => {
    const { service, display } = makeService();
    service.enableFromLocation(display, {
      hash: '#/atlas?agent=1',
      search: '',
      hostname: '127.0.0.1',
    });
    expect(service.isEnabled).toBe(true);
  });

  it('stays dormant when the search and the hash disagree', () => {
    const { service, display } = makeService();
    service.enableFromLocation(display, {
      search: '?agent=1',
      hash: '#/atlas?agent=0',
      hostname: 'localhost',
    });
    expect(service.isEnabled).toBe(false);
  });

  it('leaves a production deployment dormant, with no listener at all', () => {
    const listeners = trackMessageListeners();
    const { service, display } = makeService();
    const before = listeners.count();
    service.enableFromLocation(display, {
      search: '?agent=1',
      hostname: 'phoenix.example.org',
    });
    service.enableFromLocation(display, {
      hash: '#/atlas?agent=1',
      hostname: 'atlas.cern.ch',
    });
    expect(service.isEnabled).toBe(false);
    expect(listeners.count()).toBe(before);

    const client = new FakeClient();
    deliver(initialize, 'http://localhost:4200', client);
    expect(client.posted).toHaveLength(0);
  });

  it('never installs a second listener when called again', () => {
    const listeners = trackMessageListeners();
    const { service, display } = makeService();
    const before = listeners.count();
    const loc = { search: '?agent=1', hostname: 'localhost' };
    service.enableFromLocation(display, loc);
    service.enableFromLocation(display, loc);
    service.enable(display, ['https://embedder.example.org']);
    expect(listeners.count()).toBe(before + 1);
  });
});

describe('AgentBridgeService.enable', () => {
  it('stays dormant for an empty or missing allowlist', () => {
    const { service, display } = makeService();
    service.enable(display, []);
    expect(service.isEnabled).toBe(false);
    service.enable(display, undefined as any);
    expect(service.isEnabled).toBe(false);
  });

  it('answers a loopback client and ignores everyone else', () => {
    const { service, display } = makeService();
    service.enableFromLocation(display, {
      search: '?agent=1',
      hostname: 'localhost',
    });

    const dev = new FakeClient();
    const evil = new FakeClient();
    const sandboxed = new FakeClient();
    deliver(initialize, 'http://localhost:4321', dev);
    deliver(initialize, 'https://evil.com', evil);
    deliver(initialize, 'null', sandboxed);

    expect(dev.posted).toHaveLength(1);
    expect(dev.posted[0].msg.result.serverInfo.name).toBe('phoenix');
    expect(dev.posted[0].origin).toBe('http://localhost:4321');
    expect(evil.posted).toHaveLength(0);
    expect(sandboxed.posted).toHaveLength(0);
  });

  it('disable() stops the bridge and removes its listener', () => {
    const listeners = trackMessageListeners();
    const { service, display } = makeService();
    const before = listeners.count();
    service.enable(display, ['https://embedder.example.org']);
    service.disable();
    expect(service.isEnabled).toBe(false);
    expect(listeners.count()).toBe(before);
    const client = new FakeClient();
    deliver(initialize, 'https://embedder.example.org', client);
    expect(client.posted).toHaveLength(0);
  });

  it('disposes the bridge when the injector is destroyed', () => {
    const { service, display } = makeService();
    service.enable(display, ['https://embedder.example.org']);
    service.ngOnDestroy();
    expect(service.isEnabled).toBe(false);
  });
});

describe('AgentBridgeService: surviving route changes', () => {
  it('keeps streaming phoenix/event after the display is re-initialised', async () => {
    const { service, display } = makeService();
    service.enableFromLocation(display, {
      search: '?agent=1',
      hostname: 'localhost',
    });
    const client = new FakeClient();
    deliver(initialize, 'http://localhost:4321', client);

    // A route change re-initialises the one root EventDisplay, whose cleanup()
    // clears every bus subscriber.
    display.reinitialise();
    render();

    await display.registry.execute('ping', {});
    const events = client.posted.filter(
      (p) => p.msg.method === 'phoenix/event',
    );
    expect(events).toHaveLength(1);
    expect(events[0].msg.params.name).toBe('ping');
  });

  it('re-attaching never stacks bus listeners', () => {
    const { service, display } = makeService();
    service.enableFromLocation(display, {
      search: '?agent=1',
      hostname: 'localhost',
    });
    render();
    render();
    render();
    expect(display.listenerCount('command-executed')).toBe(1);
  });
});

describe('provideAgentBridge', () => {
  function bootstrapWith(providers: any[], display: any = fakeEventDisplay()) {
    TestBed.configureTestingModule({
      providers: [
        { provide: EventDisplayService, useValue: display },
        ...providers,
      ],
    });
    // Injecting anything runs the application initializers.
    return { service: TestBed.inject(AgentBridgeService), display };
  }

  it('stays dormant at startup when the URL does not ask for the bridge', () => {
    window.history.pushState({}, '', '/atlas');
    const { service } = bootstrapWith([provideAgentBridge()]);
    expect(service.isEnabled).toBe(false);
  });

  it('starts the bridge at startup for ?agent=1 on localhost, with no palette involved', () => {
    window.history.pushState({}, '', '/atlas?agent=1');
    const { service } = bootstrapWith([provideAgentBridge()]);
    expect(service.isEnabled).toBe(true);
    window.history.pushState({}, '', '/atlas');
  });

  it('starts the bridge from configured origins regardless of the URL', () => {
    window.history.pushState({}, '', '/atlas');
    const { service } = bootstrapWith([
      provideAgentBridge({ origins: ['https://embedder.example.org'] }),
    ]);
    expect(service.isEnabled).toBe(true);
  });

  it('an app that does not provide it gets no bridge', () => {
    window.history.pushState({}, '', '/atlas?agent=1');
    const { service } = bootstrapWith([]);
    expect(service.isEnabled).toBe(false);
    window.history.pushState({}, '', '/atlas');
  });
});
