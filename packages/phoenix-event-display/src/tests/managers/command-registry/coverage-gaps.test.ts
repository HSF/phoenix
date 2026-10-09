import { PostMessageTransport } from '../../../managers/command-registry/agent-bridge/post-message-transport';
import { createAgentBridge } from '../../../managers/command-registry/agent-bridge/agent-bridge';
import { CommandRegistry } from '../../../managers/command-registry/command-registry';
import type { CommandHost } from '../../../managers/command-registry/command-host';
import { validateArgs } from '../../../managers/command-registry/schema-validator';

/**
 * Branches that unit tests had never reached. Found by measuring coverage
 * rather than by guessing, after a gap in cache invalidation was caught by a
 * question rather than by the suite.
 */

class FakeWindow {
  handlers: any[] = [];
  addEventListener(_type: string, cb: any) {
    this.handlers.push(cb);
  }
  removeEventListener(_type: string, cb: any) {
    this.handlers = this.handlers.filter((h) => h !== cb);
  }
  deliver(event: any) {
    for (const h of this.handlers) h(event);
  }
}

/** A client window that records what it is sent. */
class FakeSource {
  posted: unknown[] = [];
  closed = false;
  postMessage(msg: unknown) {
    this.posted.push(msg);
  }
}

/** Every kind of sender a fail-closed transport must refuse. */
const PROBE_ORIGINS = [
  'http://localhost:4200',
  'http://127.0.0.1:4200',
  'https://evil.example',
  'https://anything',
  'null',
];

const tools = { jsonrpc: '2.0', id: 1, method: 'tools/list' };

// The security default that matters: a bridge constructed without origins must
// not be drivable by anyone. Opening by default would expose every embedding
// page the moment the transport is constructed. All three spellings of "no
// allowlist" are pinned, at the transport and through createAgentBridge.
const NO_ALLOWLIST: [string, object][] = [
  ['an omitted allowlist ({})', {}],
  ['an explicitly undefined allowlist', { origins: undefined }],
  ['an empty allowlist', { origins: [] }],
];

describe('the agent transport fails CLOSED', () => {
  it.each(NO_ALLOWLIST)('%s delivers nothing', (_label, options) => {
    const win = new FakeWindow();
    const transport = new PostMessageTransport({
      ...options,
      window: win,
    } as any);
    const seen: unknown[] = [];
    transport.onMessage((m) => seen.push(m));
    for (const origin of PROBE_ORIGINS) {
      win.deliver({ origin, data: tools, source: new FakeSource() });
    }
    expect(seen).toEqual([]);
  });

  it.each(NO_ALLOWLIST)(
    '%s makes createAgentBridge answer nobody',
    (_label, options) => {
      const win = new FakeWindow();
      const registry = new CommandRegistry({
        emit: () => undefined,
      } as unknown as CommandHost);
      createAgentBridge(
        { getCommandRegistry: () => registry, on: () => () => undefined },
        { ...options, window: win },
      );
      const sources = PROBE_ORIGINS.map((origin) => {
        const source = new FakeSource();
        win.deliver({ origin, data: tools, source });
        return source;
      });
      expect(sources.every((s) => s.posted.length === 0)).toBe(true);
    },
  );

  it('only a listed origin gets through', () => {
    const win = new FakeWindow();
    const transport = new PostMessageTransport({
      origins: ['http://localhost:4200'],
      window: win,
    });
    const seen: unknown[] = [];
    transport.onMessage((m) => seen.push(m));
    const source = new FakeSource();
    win.deliver({ origin: 'https://evil.example', data: 'no', source });
    win.deliver({ origin: 'http://localhost:4201', data: 'no', source });
    win.deliver({ origin: 'http://localhost:4200', data: 'yes', source });
    expect(seen).toEqual(['yes']);
  });

  it('the wildcard is honoured only when explicitly configured, and never for the opaque null origin', () => {
    const win = new FakeWindow();
    const transport = new PostMessageTransport({ origins: ['*'], window: win });
    const seen: unknown[] = [];
    transport.onMessage((m) => seen.push(m));
    const source = new FakeSource();
    win.deliver({ origin: 'null', data: 'sandboxed', source });
    win.deliver({ origin: 'https://anything', data: 'ok', source });
    expect(seen).toEqual(['ok']);
  });

  it('survives being constructed with no window at all', () => {
    // Server-side rendering or a test harness: constructing must not throw.
    expect(
      () =>
        new PostMessageTransport({ origins: ['*'], window: undefined } as any),
    ).not.toThrow();
  });
});

describe('registry error reporting', () => {
  function reg(run: () => any): CommandRegistry {
    const registry = new CommandRegistry({
      emit: () => undefined,
    } as unknown as CommandHost);
    registry.register({
      name: 'boom',
      title: 'Boom',
      description: 'A command that fails in different ways.',
      category: 'Test',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      mutates: true,
      run,
    });
    return registry;
  }

  it('reports a thrown Error by its message', async () => {
    const out = await reg(() => {
      throw new Error('detector on fire');
    }).execute('boom', {});
    expect(out).toEqual({ ok: false, error: 'detector on fire' });
  });

  it('reports a thrown non-Error too, rather than crashing', async () => {
    const out = await reg(() => {
      throw 'just a string';
    }).execute('boom', {});
    expect(out).toEqual({ ok: false, error: 'just a string' });
  });

  it('does not emit the executed event when the command failed', async () => {
    const events: string[] = [];
    const registry = new CommandRegistry({
      emit: (name: string) => events.push(name),
    } as unknown as CommandHost);
    registry.register({
      name: 'boom',
      title: 'Boom',
      description: 'A command that always fails.',
      category: 'Test',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      mutates: true,
      run: () => {
        throw new Error('nope');
      },
    });
    await registry.execute('boom', {});
    expect(events).toEqual([]);
  });
});

describe('schema validator numeric bounds', () => {
  const schema = {
    type: 'object' as const,
    properties: {
      n: { type: 'number' as const, minimum: 1, maximum: 10 },
    },
    required: ['n'],
    additionalProperties: false as const,
  };

  it('accepts a value inside the range, including the ends', () => {
    for (const n of [1, 5, 10]) {
      expect(validateArgs(schema, { n }).valid).toBe(true);
    }
  });

  it('refuses a value above the maximum', () => {
    const out = validateArgs(schema, { n: 11 });
    expect(out.valid).toBe(false);
    expect(out.error).toContain('<= 10');
  });

  it('refuses a value below the minimum', () => {
    const out = validateArgs(schema, { n: 0 });
    expect(out.valid).toBe(false);
    expect(out.error).toContain('>= 1');
  });
});
