import {
  REPLAY_PAYLOAD_MARKER,
  SessionV1,
} from '../../../managers/session-manager/session-format';
import {
  PlayerHost,
  SessionPlayer,
} from '../../../managers/session-manager/session-player';

function makeHost() {
  const emits: Array<{ n: string; d: any }> = [];
  const cameras: Array<{ pos: number[]; target: number[] }> = [];
  let stateApplies = 0;
  const host: PlayerHost = {
    emit: (n, d) => emits.push({ n, d }),
    applyStateSnapshot: () => {
      stateApplies++;
    },
    applyCamera: (pos, target) =>
      cameras.push({ pos: [...pos], target: [...target] }),
  };
  return {
    host,
    emits,
    cameras,
    get stateApplies() {
      return stateApplies;
    },
  };
}

function makeSession(): SessionV1 {
  return {
    version: 1,
    createdAt: '2026-06-02T00:00:00.000Z',
    duration: 1000,
    source: {},
    initialState: { ok: true },
    events: [
      { t: 100, name: 'a', payload: { x: 1 } },
      { t: 500, name: 'b', payload: { y: 2 } },
      { t: 900, name: 'c', payload: null },
    ],
    cameraSamples: [
      { t: 0, pos: [0, 0, 0], target: [0, 0, 0] },
      { t: 500, pos: [10, 0, 0], target: [0, 0, 0] },
      { t: 1000, pos: [20, 0, 0], target: [0, 0, 0] },
    ],
  };
}

describe('SessionPlayer', () => {
  it('seek(end) re-emits every event with the replay marker', () => {
    const ctx = makeHost();
    const player = new SessionPlayer(ctx.host, makeSession());
    player.seek(1000);
    expect(ctx.emits.length).toBe(3);
    for (const e of ctx.emits) {
      expect(e.d[REPLAY_PAYLOAD_MARKER]).toBe(true);
    }
    expect(player.isFinished).toBe(true);
  });

  it('seek wraps non-object payloads under {value, __phoenixReplay}', () => {
    const ctx = makeHost();
    const player = new SessionPlayer(ctx.host, makeSession());
    player.seek(1000);
    const last = ctx.emits[2];
    expect(last.n).toBe('c');
    expect(last.d[REPLAY_PAYLOAD_MARKER]).toBe(true);
  });

  it('seek backwards re-applies initial state then replays up to t', () => {
    const ctx = makeHost();
    const player = new SessionPlayer(ctx.host, makeSession());
    player.seek(1000);
    expect(ctx.stateApplies).toBe(1);
    player.seek(200);
    expect(ctx.stateApplies).toBe(2);
    const lastBatch = ctx.emits.slice(3);
    expect(lastBatch.length).toBe(1);
    expect(lastBatch[0].n).toBe('a');
  });

  it('applyCamera interpolates between bracketing samples', () => {
    const ctx = makeHost();
    const player = new SessionPlayer(ctx.host, makeSession());
    player.seek(250);
    const last = ctx.cameras[ctx.cameras.length - 1];
    expect(last.pos[0]).toBeCloseTo(5, 1);
  });

  it('setSpeed before play does not throw and persists', () => {
    const ctx = makeHost();
    const player = new SessionPlayer(ctx.host, makeSession());
    player.setSpeed(2);
    expect(player.speed).toBe(2);
  });

  it('onTick fires on seek with current playhead', () => {
    const ctx = makeHost();
    const player = new SessionPlayer(ctx.host, makeSession());
    const ticks: number[] = [];
    player.onTick((t) => ticks.push(t));
    player.seek(500);
    expect(ticks.pop()).toBe(500);
  });

  it('exposes session metadata on the public API', () => {
    const ctx = makeHost();
    const session = makeSession();
    const player = new SessionPlayer(ctx.host, session);
    expect(player.duration).toBe(1000);
    expect(player.eventCount).toBe(3);
    expect(player.speed).toBe(1);
    expect(player.session).toBe(session);
  });
});
