import {
  PostMessageTransport,
  isLoopbackOrigin,
  isOriginAllowed,
  type AgentPeer,
} from '../../../managers/command-registry/agent-bridge';

/** A window stand-in that lets a test dispatch synthetic 'message' events. */
class FakeWindow {
  private listeners: Record<string, ((e: any) => void)[]> = {};
  addEventListener(type: string, cb: (e: any) => void): void {
    (this.listeners[type] ??= []).push(cb);
  }
  removeEventListener(type: string, cb: (e: any) => void): void {
    this.listeners[type] = (this.listeners[type] ?? []).filter((c) => c !== cb);
  }
  dispatch(type: string, event: any): void {
    (this.listeners[type] ?? []).forEach((cb) => cb(event));
  }
  listenerCount(type: string): number {
    return (this.listeners[type] ?? []).length;
  }
}

/** A client window that records what is posted to it. */
class FakeSource {
  posted: { msg: any; origin: string }[] = [];
  closed = false;
  postMessage(msg: any, origin: string): void {
    this.posted.push({ msg, origin });
  }
}

const request = { jsonrpc: '2.0', id: 1, method: 'tools/list' };

/** A transport bound to a fake window, recording every delivery. */
function listen(origins: any[]) {
  const win = new FakeWindow();
  const transport = new PostMessageTransport({ origins, window: win as any });
  const received: { msg: unknown; peer: AgentPeer }[] = [];
  transport.onMessage((msg, peer) => received.push({ msg, peer }));
  const deliver = (origin: any, source: any, data: any = request) =>
    win.dispatch('message', { data, origin, source });
  return { win, transport, received, deliver };
}

describe('isLoopbackOrigin (the ?agent=1 local development policy)', () => {
  it.each([
    'http://localhost:4200',
    'https://localhost:8443',
    'http://localhost',
    'http://127.0.0.1:4200',
    'http://[::1]:4200',
  ])('admits %s', (origin) => {
    expect(isLoopbackOrigin(origin)).toBe(true);
  });

  it.each([
    // look-alike hosts: a DNS name that merely starts or ends like localhost
    'http://localhost.evil.com',
    'http://localhost.evil.com:4200',
    'http://evil-localhost:4200',
    'http://127.0.0.1.nip.io',
    'http://localhost.:4200',
    // other loopback-ish addresses the policy deliberately does not cover
    'http://127.0.0.2',
    'http://0.0.0.0:4200',
    // opaque and non-web origins (a sandboxed srcdoc iframe reports "null")
    'null',
    'file://',
    'file:///home/user/page.html',
    'ws://localhost:4200',
    'javascript:alert(1)',
    // not a canonical origin string, so never what a browser sends
    'http://localhost:4200/atlas',
    'http://user@localhost:4200',
    'localhost',
    'localhost:4200',
    '',
    // remote
    'https://evil.com',
    'http://evil.com?localhost',
  ])('rejects %s', (origin) => {
    expect(isLoopbackOrigin(origin)).toBe(false);
  });

  it('rejects values that are not strings', () => {
    for (const origin of [undefined, null, 42, {}, ['http://localhost']]) {
      expect(isLoopbackOrigin(origin)).toBe(false);
    }
  });
});

describe('isOriginAllowed', () => {
  it('matches a configured origin by its parsed value, never by substring', () => {
    const rules = ['https://ok.example'];
    expect(isOriginAllowed('https://ok.example', rules)).toBe(true);
    for (const origin of [
      'https://ok.example.evil.com',
      'https://evil.com/https://ok.example',
      'https://notok.example',
      'http://ok.example',
      'https://ok.example:8443',
    ]) {
      expect(isOriginAllowed(origin, rules)).toBe(false);
    }
  });

  it('tolerates a trailing slash in a configured origin', () => {
    expect(isOriginAllowed('https://ok.example', ['https://ok.example/'])).toBe(
      true,
    );
  });

  it('honours an explicitly configured "*" for any concrete origin', () => {
    expect(isOriginAllowed('https://anywhere.example', ['*'])).toBe(true);
  });

  it('never admits the opaque "null" origin, even when listed or under "*"', () => {
    // A reply cannot be addressed to an opaque origin without falling back to
    // targetOrigin "*", which would hand it to whatever the window navigated to.
    expect(isOriginAllowed('null', ['null'])).toBe(false);
    expect(isOriginAllowed('null', ['*'])).toBe(false);
    expect(isOriginAllowed('null', [isLoopbackOrigin])).toBe(false);
  });

  it('a malformed configuration entry admits nothing', () => {
    const rules = ['ok.example', 'not a url', ''];
    expect(isOriginAllowed('https://ok.example', rules)).toBe(false);
    expect(isOriginAllowed('http://ok.example', rules)).toBe(false);
  });

  it('accepts a matcher rule such as the loopback policy', () => {
    expect(isOriginAllowed('http://localhost:4200', [isLoopbackOrigin])).toBe(
      true,
    );
    expect(
      isOriginAllowed('http://localhost.evil.com', [isLoopbackOrigin]),
    ).toBe(false);
  });

  it('a matcher that throws denies instead of crashing', () => {
    const broken = () => {
      throw new Error('bad rule');
    };
    expect(isOriginAllowed('https://ok.example', [broken])).toBe(false);
  });

  it('denies an empty, missing or non-string origin under any policy', () => {
    for (const origin of ['', undefined, null, 7]) {
      expect(isOriginAllowed(origin, ['*', isLoopbackOrigin])).toBe(false);
    }
  });
});

describe('PostMessageTransport: origin allowlist', () => {
  it('delivers an allowed message together with a peer for its sender', () => {
    const { received, deliver } = listen(['https://ok']);
    deliver('https://ok', new FakeSource());
    expect(received).toHaveLength(1);
    expect(received[0].msg).toEqual(request);
    expect(received[0].peer.origin).toBe('https://ok');
  });

  it('drops a message from a disallowed origin', () => {
    const { received, deliver } = listen(['https://ok']);
    deliver('https://evil', new FakeSource());
    expect(received).toHaveLength(0);
  });

  it('with the loopback policy, admits local dev servers and rejects look-alikes', () => {
    const { received, deliver } = listen([isLoopbackOrigin]);
    deliver('http://localhost:4321', new FakeSource());
    deliver('http://localhost.evil.com', new FakeSource());
    deliver('null', new FakeSource());
    deliver('https://evil.com', new FakeSource());
    expect(received.map((r) => r.peer.origin)).toEqual([
      'http://localhost:4321',
    ]);
  });

  it('drops a message that has no window to answer', () => {
    const { received, deliver } = listen(['https://ok']);
    deliver('https://ok', undefined);
    deliver('https://ok', null);
    deliver('https://ok', {});
    expect(received).toHaveLength(0);
  });
});

describe('PostMessageTransport: addressing', () => {
  it('a peer posts only to its own window, targeting that window origin exactly', () => {
    const { received, deliver } = listen(['https://ok']);
    const source = new FakeSource();
    deliver('https://ok', source);
    received[0].peer.send({ jsonrpc: '2.0', id: 1, result: {} });
    expect(source.posted).toEqual([
      { msg: { jsonrpc: '2.0', id: 1, result: {} }, origin: 'https://ok' },
    ]);
  });

  it('replying to one client never reaches another client', () => {
    const { received, deliver } = listen(['https://a', 'https://b']);
    const a = new FakeSource();
    const b = new FakeSource();
    deliver('https://a', a);
    deliver('https://b', b);
    received[0].peer.send({ jsonrpc: '2.0', id: 1, result: 'for a' });
    expect(a.posted).toHaveLength(1);
    expect(b.posted).toHaveLength(0);
  });

  it('has no broadcast: the transport itself cannot send to every sender', () => {
    const { transport } = listen(['https://ok']);
    expect((transport as any).send).toBeUndefined();
  });

  it('gives the same window the same peer across messages', () => {
    const { received, deliver } = listen(['https://ok']);
    const source = new FakeSource();
    deliver('https://ok', source);
    deliver('https://ok', source);
    expect(received[0].peer).toBe(received[1].peer);
  });

  it('gives a window that navigated to another allowed origin a new peer for that origin', () => {
    const { received, deliver } = listen(['https://a', 'https://b']);
    const source = new FakeSource();
    deliver('https://a', source);
    deliver('https://b', source);
    expect(received[1].peer).not.toBe(received[0].peer);
    received[1].peer.send({ n: 1 });
    expect(source.posted[0].origin).toBe('https://b');
  });

  it('reports a peer as closed once its window has closed', () => {
    const { received, deliver } = listen(['https://ok']);
    const source = new FakeSource();
    deliver('https://ok', source);
    expect(received[0].peer.isClosed()).toBe(false);
    source.closed = true;
    expect(received[0].peer.isClosed()).toBe(true);
  });

  it('holds sender windows only weakly (no iterable collection of windows)', () => {
    const { transport, deliver } = listen(['https://ok']);
    const source = new FakeSource();
    deliver('https://ok', source);
    for (const value of Object.values(transport)) {
      if (value instanceof Map) {
        expect([...value.keys(), ...value.values()]).not.toContain(source);
      }
      if (value instanceof Set) expect([...value]).not.toContain(source);
      if (Array.isArray(value)) expect(value).not.toContain(source);
    }
  });
});

describe('PostMessageTransport: lifecycle', () => {
  it('close() removes the window listener and stops delivering', () => {
    const { win, transport, received, deliver } = listen(['https://ok']);
    expect(win.listenerCount('message')).toBe(1);
    transport.close();
    expect(win.listenerCount('message')).toBe(0);
    deliver('https://ok', new FakeSource());
    expect(received).toHaveLength(0);
  });

  it('ignores messages that arrive before a handler is registered', () => {
    const win = new FakeWindow();
    new PostMessageTransport({ origins: ['https://ok'], window: win as any });
    expect(() =>
      win.dispatch('message', {
        data: request,
        origin: 'https://ok',
        source: new FakeSource(),
      }),
    ).not.toThrow();
  });
});
