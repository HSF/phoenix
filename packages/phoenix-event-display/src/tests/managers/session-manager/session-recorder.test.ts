import {
  RecorderHost,
  SessionRecorder,
} from '../../../managers/session-manager/session-recorder';
import {
  MAX_EVENTS_PER_SESSION,
  MAX_RECORDING_DURATION_MS,
  REPLAY_PAYLOAD_MARKER,
} from '../../../managers/session-manager/session-format';

function makeHost(): {
  host: RecorderHost;
  emit: (n: string, d: any) => void;
  setSample: (s: any) => void;
} {
  const wildcardSubs = new Set<(n: string, d: any) => void>();
  let sample: any = { pos: [0, 0, 0], target: [0, 0, 0] };
  const host: RecorderHost = {
    onAny: (cb) => {
      wildcardSubs.add(cb);
      return () => wildcardSubs.delete(cb);
    },
    getStateSnapshot: () => ({ snapshot: true }),
    getCameraSample: () => sample,
  };
  return {
    host,
    emit: (name, data) => wildcardSubs.forEach((cb) => cb(name, data)),
    setSample: (s) => (sample = s),
  };
}

describe('SessionRecorder', () => {
  it('records events and returns a v1 session on stop', () => {
    const { host, emit } = makeHost();
    const rec = new SessionRecorder(host);
    rec.start({ source: { experiment: 'test' } });
    emit('a', { x: 1 });
    emit('b', { y: 2 });
    const session = rec.stop();
    expect(session.version).toBe(1);
    expect(session.events.length).toBe(2);
    expect(session.events[0].name).toBe('a');
    expect(session.source.experiment).toBe('test');
    expect(session.initialState).toEqual({ snapshot: true });
  });

  it('throws when start is called while already recording', () => {
    const { host } = makeHost();
    const rec = new SessionRecorder(host);
    rec.start();
    expect(() => rec.start()).toThrow();
    rec.stop();
  });

  it('returns an empty session when stop is called twice', () => {
    const { host, emit } = makeHost();
    const rec = new SessionRecorder(host);
    rec.start();
    emit('a', {});
    rec.stop();
    const s2 = rec.stop();
    expect(s2.events.length).toBe(1);
  });

  it('ignores replay-marked payloads to prevent feedback loops', () => {
    const { host, emit } = makeHost();
    const rec = new SessionRecorder(host);
    rec.start();
    emit('a', { [REPLAY_PAYLOAD_MARKER]: true });
    emit('b', { x: 1 });
    const session = rec.stop();
    expect(session.events.map((e) => e.name)).toEqual(['b']);
  });

  it('skips payloads that are not JSON-serializable', () => {
    const { host, emit } = makeHost();
    const rec = new SessionRecorder(host);
    rec.start();
    const circular: any = { name: 'x' };
    circular.self = circular;
    emit('a', circular);
    emit('b', { y: 2 });
    const session = rec.stop();
    expect(session.events.map((e) => e.name)).toEqual(['b']);
  });

  it('captures camera samples and deduplicates identical positions', () => {
    jest.useFakeTimers();
    const { host } = makeHost();
    const rec = new SessionRecorder(host);
    rec.start({ cameraSampleIntervalMs: 10 });
    jest.advanceTimersByTime(50);
    const session = rec.stop();
    expect(session.cameraSamples.length).toBe(1);
    jest.useRealTimers();
  });

  it('updates duration as events arrive', () => {
    jest.useFakeTimers();
    const { host, emit } = makeHost();
    const rec = new SessionRecorder(host);
    rec.start();
    jest.advanceTimersByTime(120);
    emit('a', { x: 1 });
    const session = rec.stop();
    expect(session.events[0].t).toBeGreaterThanOrEqual(120);
    jest.useRealTimers();
  });

  it('auto-stops when the event cap is exceeded', () => {
    const { host, emit } = makeHost();
    const rec = new SessionRecorder(host);
    rec.start();
    for (let i = 0; i < MAX_EVENTS_PER_SESSION + 5; i++) {
      emit('e', { i });
    }
    expect(rec.isRecording).toBe(false);
    expect(rec.autoStopReason).toBe('cap-events');
    expect(rec.eventCount).toBe(MAX_EVENTS_PER_SESSION);
  });

  it('auto-stops when the duration cap is exceeded', () => {
    jest.useFakeTimers();
    const { host, emit } = makeHost();
    const rec = new SessionRecorder(host);
    rec.start();
    jest.advanceTimersByTime(MAX_RECORDING_DURATION_MS + 1000);
    emit('late', { x: 1 });
    expect(rec.isRecording).toBe(false);
    expect(rec.autoStopReason).toBe('cap-duration');
    jest.useRealTimers();
  });
});
