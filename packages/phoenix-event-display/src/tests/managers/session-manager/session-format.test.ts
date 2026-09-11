import {
  MAX_EVENTS_PER_SESSION,
  MAX_RECORDING_DURATION_MS,
  SESSION_VERSION,
  SessionEvent,
  CameraSample,
  validateSession,
} from '../../../managers/session-manager/session-format';

function validBase(): {
  version: number;
  createdAt: string;
  duration: number;
  source: { experiment: string };
  initialState: Record<string, unknown>;
  events: SessionEvent[];
  cameraSamples: CameraSample[];
} {
  return {
    version: SESSION_VERSION,
    createdAt: new Date().toISOString(),
    duration: 5000,
    source: { experiment: 'atlas' },
    initialState: {},
    events: [{ t: 0, name: 'particle-tagged', payload: { uuid: 'u' } }],
    cameraSamples: [{ t: 0, pos: [0, 0, 0], target: [0, 0, 0] }],
  };
}

describe('session-format.validateSession', () => {
  it('accepts a well-formed session', () => {
    expect(validateSession(validBase())).not.toBeNull();
  });

  it('rejects null and non-objects', () => {
    expect(validateSession(null)).toBeNull();
    expect(validateSession(undefined)).toBeNull();
    expect(validateSession(42)).toBeNull();
    expect(validateSession('session')).toBeNull();
  });

  it('rejects wrong version', () => {
    const s = validBase();
    (s as any).version = 99;
    expect(validateSession(s)).toBeNull();
  });

  it('rejects non-string createdAt', () => {
    const s = validBase();
    (s as any).createdAt = 1234;
    expect(validateSession(s)).toBeNull();
  });

  it('rejects negative duration', () => {
    const s = validBase();
    s.duration = -1;
    expect(validateSession(s)).toBeNull();
  });

  it('rejects oversized duration', () => {
    const s = validBase();
    s.duration = MAX_RECORDING_DURATION_MS + 1;
    expect(validateSession(s)).toBeNull();
  });

  it('rejects missing source', () => {
    const s = validBase();
    (s as any).source = null;
    expect(validateSession(s)).toBeNull();
  });

  it('rejects events not an array', () => {
    const s = validBase();
    (s as any).events = 'not array';
    expect(validateSession(s)).toBeNull();
  });

  it('rejects too many events', () => {
    const s = validBase();
    s.events = new Array(MAX_EVENTS_PER_SESSION + 1).fill({
      t: 0,
      name: 'x',
      payload: {},
    });
    expect(validateSession(s)).toBeNull();
  });

  it('rejects event with empty name', () => {
    const s = validBase();
    s.events = [{ t: 0, name: '', payload: {} }];
    expect(validateSession(s)).toBeNull();
  });

  it('rejects event with negative t', () => {
    const s = validBase();
    s.events = [{ t: -1, name: 'x', payload: {} }];
    expect(validateSession(s)).toBeNull();
  });

  it('rejects camera sample with NaN component', () => {
    const s = validBase();
    s.cameraSamples = [{ t: 0, pos: [0, NaN, 0], target: [0, 0, 0] }];
    expect(validateSession(s)).toBeNull();
  });

  it('rejects camera sample with wrong pos length', () => {
    const s = validBase();
    s.cameraSamples = [{ t: 0, pos: [0, 0] as any, target: [0, 0, 0] }];
    expect(validateSession(s)).toBeNull();
  });
});
