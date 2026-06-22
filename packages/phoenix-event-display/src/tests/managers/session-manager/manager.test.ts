import {
  SessionManager,
  SessionManagerHost,
} from '../../../managers/session-manager/session-manager';
import { SessionV1 } from '../../../managers/session-manager/session-format';

function makeHost() {
  const emits: Array<{ n: string; d: any }> = [];
  const host: SessionManagerHost = {
    onAny: () => () => {},
    getStateSnapshot: () => ({}),
    getCameraSample: () => null,
    emit: (n, d) => emits.push({ n, d }),
    applyStateSnapshot: () => {},
    applyCamera: () => {},
  };
  return { host, emits };
}

function sessionJson(): string {
  const s: SessionV1 = {
    version: 1,
    createdAt: '2026-06-06T00:00:00.000Z',
    duration: 500,
    source: { experiment: 'atlas' },
    initialState: {},
    events: [{ t: 100, name: 'particle-tagged', payload: { uuid: 'a' } }],
    cameraSamples: [],
  };
  return JSON.stringify(s);
}

describe('SessionManager pending (click-to-play) flow', () => {
  it('prepareFromJsonText stages a pending session WITHOUT emitting events', () => {
    const { host, emits } = makeHost();
    const sm = new SessionManager(host);
    sm.prepareFromJsonText(sessionJson(), 'example.com');

    const state = sm.state.value;
    expect(state?.kind).toBe('pending');
    if (state?.kind === 'pending') {
      expect(state.sourceLabel).toBe('example.com');
      expect(state.session.events.length).toBe(1);
    }
    // Critical: nothing replayed on the bus until the user confirms.
    expect(emits.length).toBe(0);
  });

  it('playPending starts playback and re-emits the recorded event', () => {
    const { host, emits } = makeHost();
    const sm = new SessionManager(host);
    sm.prepareFromJsonText(sessionJson(), 'example.com');
    sm.playPending();

    expect(['playing', 'finished']).toContain(sm.state.value?.kind);
    // Drive past the event timestamp via a seek to flush the emission.
    sm.seek(500);
    expect(emits.map((e) => e.n)).toContain('particle-tagged');
  });

  it('playPending is a no-op when there is no pending session', () => {
    const { host, emits } = makeHost();
    const sm = new SessionManager(host);
    sm.playPending();
    expect(sm.state.value?.kind).toBe('idle');
    expect(emits.length).toBe(0);
  });

  it('stopPlayback discards a pending session back to idle without playing', () => {
    const { host, emits } = makeHost();
    const sm = new SessionManager(host);
    sm.prepareFromJsonText(sessionJson(), 'example.com');
    sm.stopPlayback();
    expect(sm.state.value?.kind).toBe('idle');
    sm.playPending(); // must not resurrect the dismissed session
    expect(emits.length).toBe(0);
    expect(sm.state.value?.kind).toBe('idle');
  });

  it('rejects malformed JSON and surfaces an error state', () => {
    const { host } = makeHost();
    const sm = new SessionManager(host);
    expect(() => sm.prepareFromJsonText('{not json', 'example.com')).toThrow();
    expect(sm.state.value?.kind).toBe('error');
  });
});
