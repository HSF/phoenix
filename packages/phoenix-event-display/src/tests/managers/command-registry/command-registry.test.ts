import {
  CommandRegistry,
  COMMAND_EXECUTED_EVENT,
} from '../../../managers/command-registry/command-registry';
import type { CommandHost } from '../../../managers/command-registry/command-host';
import type { Command } from '../../../managers/command-registry/command.model';

function fakeHost(): CommandHost & { emit: jest.Mock } {
  return {
    eventDisplay: {},
    ui: {},
    three: {},
    state: {},
    emit: jest.fn(),
    resolveObject: () => undefined,
    listGeometryParts: () => [],
  };
}

const ping: Command = {
  name: 'ping',
  description: 'test',
  category: 'Test',
  inputSchema: {
    type: 'object',
    properties: { n: { type: 'integer' } },
    required: ['n'],
    additionalProperties: false,
  },
  mutates: false,
  run: (a: { n: number }) => a.n * 2,
};

describe('CommandRegistry', () => {
  it('registers, gets, and lists in name order', () => {
    const r = new CommandRegistry(fakeHost());
    r.register({ ...ping, name: 'b' });
    r.register({ ...ping, name: 'a' });
    expect(r.get('a')?.name).toBe('a');
    expect(r.list().map((c) => c.name)).toEqual(['a', 'b']);
  });

  it('describes commands as MCP tool shapes', () => {
    const r = new CommandRegistry(fakeHost());
    r.register(ping);
    expect(r.toToolSchemas()[0]).toEqual({
      name: 'ping',
      description: 'test',
      inputSchema: ping.inputSchema,
    });
  });

  it('rejects an unknown command', async () => {
    const r = new CommandRegistry(fakeHost());
    expect(await r.execute('nope')).toEqual({
      ok: false,
      error: "unknown command 'nope'",
    });
  });

  it('rejects invalid args and does not emit', async () => {
    const host = fakeHost();
    const r = new CommandRegistry(host);
    r.register(ping);
    const res = await r.execute('ping', { n: 'x' });
    expect(res.ok).toBe(false);
    expect(host.emit).not.toHaveBeenCalled();
  });

  it('runs a valid command, returns its result, and emits command-executed', async () => {
    const host = fakeHost();
    const r = new CommandRegistry(host);
    r.register(ping);
    const res = await r.execute('ping', { n: 3 });
    expect(res).toEqual({ ok: true, result: 6 });
    expect(host.emit).toHaveBeenCalledWith(COMMAND_EXECUTED_EVENT, {
      name: 'ping',
      args: { n: 3 },
      result: 6,
    });
  });

  it('returns ok:false when a handler throws', async () => {
    const host = fakeHost();
    const r = new CommandRegistry(host);
    r.register({
      ...ping,
      name: 'boom',
      run: () => {
        throw new Error('kaboom');
      },
    });
    expect(await r.execute('boom', { n: 1 })).toEqual({
      ok: false,
      error: 'kaboom',
    });
  });
});
