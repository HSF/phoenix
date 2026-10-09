import { CommandRegistry } from '../../../managers/command-registry/command-registry';
import { registerDefaultCommands } from '../../../managers/command-registry/default-commands';
import type { CommandHost } from '../../../managers/command-registry/command-host';
import {
  buildSystemPrompt,
  keywordFallback,
  sanitizeRequest,
} from '../../../managers/command-registry/nl-intent';
import { contentTokens } from '../../../managers/command-registry/knowledge-base';

/**
 * Defects found by the five-agent review of this branch, each pinned on the
 * path that ships rather than on a helper one layer below it.
 */

function registryWith(eventDisplay: Record<string, unknown>): {
  registry: CommandRegistry;
  loaded: string[];
} {
  const loaded: string[] = [];
  const registry = new CommandRegistry({
    eventDisplay: { loadEvent: (k: string) => loaded.push(k), ...eventDisplay },
    ui: {},
    three: {},
    state: {},
    emit: () => undefined,
    resolveObject: () => undefined,
    listGeometryParts: () => [],
  } as unknown as CommandHost);
  registerDefaultCommands(registry);
  return { registry, loaded };
}

describe('load-event refuses a key that is not loaded', () => {
  // EventDisplay.loadEvent has no else branch, so an unknown key used to
  // report success and change nothing. An agent calling tools/call cannot see
  // the display, so a confident false success is the worst possible reply.
  it('loads a key that exists', async () => {
    const { registry, loaded } = registryWith({
      getEventsData: () => ({ 'run/1': {}, 'run/2': {} }),
    });
    const out = await registry.execute('load-event', { eventKey: 'run/2' });
    expect(out).toMatchObject({ ok: true });
    expect(loaded).toEqual(['run/2']);
  });

  it('refuses an unknown key without acting, and names what is available', async () => {
    const { registry, loaded } = registryWith({
      getEventsData: () => ({ 'run/1': {}, 'run/2': {} }),
    });
    const out = await registry.execute('load-event', { eventKey: 'Event 3' });
    expect(out).toMatchObject({ ok: false });
    expect(loaded).toEqual([]);
    expect(JSON.stringify(out)).toContain('run/1');
  });

  it('refuses when no events are loaded at all', async () => {
    const { registry, loaded } = registryWith({
      getEventsData: () => undefined,
    });
    const out = await registry.execute('load-event', { eventKey: 'run/1' });
    expect(out).toMatchObject({ ok: false });
    expect(loaded).toEqual([]);
  });

  it('keeps the error short when a file holds thousands of events', async () => {
    const many: Record<string, unknown> = {};
    for (let i = 0; i < 5000; i++) many[`run/${i}`] = {};
    const { registry } = registryWith({ getEventsData: () => many });
    const out = await registry.execute('load-event', { eventKey: 'nope' });
    expect(out).toMatchObject({ ok: false });
    expect(JSON.stringify(out).length).toBeLessThan(600);
  });

  it('stays permissive for a host that cannot list its events', async () => {
    // Same rule as geometry parts: refusing everything when the host cannot
    // enumerate would break the command for that host entirely.
    const { registry, loaded } = registryWith({});
    const out = await registry.execute('load-event', { eventKey: 'run/9' });
    expect(out).toMatchObject({ ok: true });
    expect(loaded).toEqual(['run/9']);
  });
});

describe('sanitizeRequest bounds and cleans text before anything reads it', () => {
  it('strips zero-width and Unicode Tag characters', () => {
    const hidden =
      '\u200B\u200F\uFEFF' + String.fromCodePoint(0xe0041, 0xe0042);
    expect(sanitizeRequest(`dark ${hidden}mode`)).toBe('dark mode');
  });

  it('preserves case, because a model reads it and names are case-sensitive', () => {
    expect(sanitizeRequest('Hide The LAr HEC')).toBe('Hide The LAr HEC');
  });

  it('bounds the length', () => {
    expect(sanitizeRequest('x'.repeat(10000)).length).toBeLessThanOrEqual(400);
  });

  it('never throws on missing input', () => {
    expect(sanitizeRequest(undefined as unknown as string)).toBe('');
    expect(sanitizeRequest(null as unknown as string)).toBe('');
  });

  it('keeps a huge query from stalling the prompt builder', () => {
    // buildSystemPrompt tokenised the raw query: measured ~376 ms for a 4 MB
    // paste, synchronously on the main thread while rendering was paused.
    const registry = registryWith({}).registry;
    const tools = registry.toToolSchemas();
    const huge = 'show me the next event please '.repeat(140000);
    let best = Infinity;
    for (let i = 0; i < 3; i++) {
      const t0 = performance.now();
      buildSystemPrompt(tools, undefined, huge);
      best = Math.min(best, performance.now() - t0);
    }
    expect({ tooSlow: best > 100, ms: Number(best.toFixed(1)) }).toEqual(
      expect.objectContaining({ tooSlow: false }),
    );
  });
});

describe('the few-shot examples do not teach the bug the new argument fixes', () => {
  it('a phrasing that states a projection carries that projection', () => {
    // toggle-camera-projection gained an `orthographic` argument so a stated
    // target is idempotent. An example teaching the bare flip for "switch to
    // an orthographic camera" trains the model to undo the user's request
    // whenever the camera is already orthographic.
    const tools = registryWith({}).registry.toToolSchemas();
    const prompt = buildSystemPrompt(
      tools,
      undefined,
      'switch to an orthographic camera',
    );
    const pairs = [...prompt.matchAll(/user: (.*)\n(\{.*\})/g)].map((m) => ({
      q: m[1],
      intent: JSON.parse(m[2]),
    }));
    const projection = pairs.filter(
      (p) => p.intent.command === 'toggle-camera-projection',
    );
    // Guard against a vacuous pass: the example must actually be rendered.
    expect(projection.length).toBeGreaterThan(0);
    for (const p of projection) {
      if (/ortho/i.test(p.q))
        expect(p.intent.args).toEqual({ orthographic: true });
      if (/perspective/i.test(p.q)) {
        expect(p.intent.args).toEqual({ orthographic: false });
      }
    }
  });
});

describe('geometry requests the single-part command cannot honour are declined', () => {
  const live = { geometryParts: ['Pixel', 'Beam', 'SCT'] };

  it('"hide everything except the pixel" is declined, not inverted', () => {
    // It used to return {part: Pixel, visible: false}: hiding the one part the
    // student asked to keep.
    expect(
      keywordFallback('hide everything except the pixel', live),
    ).toBeNull();
    expect(keywordFallback('hide all but the beam', live)).toBeNull();
    expect(
      keywordFallback('show everything apart from the sct', live),
    ).toBeNull();
  });

  it('a request with two opposite actions is declined rather than half-done', () => {
    expect(
      keywordFallback('show the pixel and hide the beam', live),
    ).toBeNull();
  });

  it('a plain single-part request still works', () => {
    expect(keywordFallback('hide the pixel', live)).toEqual({
      command: 'set-geometry-visibility',
      args: { part: 'Pixel', visible: false },
    });
  });
});

describe('the token cache is keyed on the bounded text, not the raw paste', () => {
  it('two pastes identical within the bound share one cache entry', () => {
    // Keying on the raw string stored every distinct huge paste in full
    // (300 x 200 KB grew the heap from 33 to 88 MB, with a ~1 GB ceiling).
    const prefix = 'what is a jet '.padEnd(400, 'z');
    const a = contentTokens(prefix + 'A'.repeat(200000));
    const b = contentTokens(prefix + 'B'.repeat(200000));
    expect(b).toBe(a);
  });
});
