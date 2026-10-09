import {
  CommandRegistry,
  registerDefaultCommands,
  keywordFallback,
  isConceptQuestion,
  COMMAND_EXECUTED_EVENT,
} from 'phoenix-event-display';
import {
  NaturalLanguageService,
  type NlOutcome,
} from './natural-language.service';

/**
 * Two defects found by driving the REAL ask() path rather than the matcher.
 *
 * Both are the "reports success but did not do the thing" class, which is the
 * worst outcome for a student and for an agent: the caller is told it worked.
 */
function harness() {
  const calls: Record<string, any[][]> = {};
  const rec =
    (n: string, r?: any) =>
    (...a: any[]) => {
      (calls[n] ??= []).push(a);
      return r;
    };
  const registry = new CommandRegistry({
    eventDisplay: {
      nextEvent: rec('nextEvent'),
      previousEvent: rec('previousEvent'),
      getCollections: () => ({
        Tracks: ['CombinedInDetTracks'],
        Jets: ['AntiKt4EMTopoJets'],
      }),
      getCollection: rec('getCollection', [{ uuid: 'u1' }]),
    },
    ui: {
      setDarkTheme: rec('setDarkTheme'),
      setShowAxis: rec('setShowAxis'),
      getPresetViews: () => [{ name: 'Left View' }],
    },
    three: {},
    state: {},
    emit: () => undefined,
    resolveObject: () => ({ uuid: 'u1' }),
    listGeometryParts: () => ['Beam'],
  } as any);
  registerDefaultCommands(registry);

  const svc = Object.create(
    NaturalLanguageService.prototype,
  ) as NaturalLanguageService;
  (svc as any).eventDisplay = {
    getCommandRegistry: () => registry,
    getCollections: () => ({
      Tracks: ['CombinedInDetTracks'],
      Jets: ['AntiKt4EMTopoJets'],
    }),
    getUIManager: () => ({ getPresetViews: () => [{ name: 'Left View' }] }),
    getEventsData: () => ({ 'run/1': {} }),
    getGeometryPartNames: () => ['Beam'],
  };
  (svc as any).knowledgeCache = null;
  (svc as any).knowledgeSignature = '';
  return { svc, calls };
}

describe('a question mark must not swallow a command', () => {
  it('"next event?" advances the event instead of returning a definition', async () => {
    // A student asking politely still means it as an instruction. Before this,
    // isConceptQuestion matched the trailing "?" and ask() returned a tutor
    // answer with ok:true while nextEvent() was never called, so the UI
    // reported success for something that did not happen.
    const { svc, calls } = harness();
    const out = await svc.ask('next event?');
    expect(out.command).toBe('next-event');
    expect(calls.nextEvent ?? []).toHaveLength(1);
  });

  it('"please switch to dark mode?" switches the theme', async () => {
    const { svc, calls } = harness();
    const out = await svc.ask('please switch to dark mode?');
    expect(out.command).toBe('set-theme');
    expect(calls.setDarkTheme?.[0]).toEqual([true]);
  });

  it('"show the axes?" shows them', async () => {
    const { svc, calls } = harness();
    await svc.ask('show the axes?');
    expect(calls.setShowAxis?.[0]).toEqual([true]);
  });

  it('a genuine question with a "?" is still answered, not executed', async () => {
    const { svc, calls } = harness();
    const out = await svc.ask('what is a jet?');
    expect(out.answer?.title).toBe('Jet');
    expect(out.command).toBeUndefined();
    expect(Object.keys(calls)).toEqual([]);
  });

  it('a question about a feature is still answered, not run', async () => {
    const { svc } = harness();
    const out = await svc.ask('what is dark mode?');
    expect(out.answer).toBeDefined();
    expect(out.command).toBeUndefined();
  });
});

describe('the collection enum must name collections, not their types', () => {
  it('offers the real collection names an object lookup accepts', () => {
    // getCollections() returns { type: [collectionName, ...] }. Feeding the
    // model the KEYS pinned the enum to type names like "Tracks", which
    // getCollection() does not resolve, so every object command failed on the
    // model path with "no object at Tracks[0]".
    const { svc } = harness();
    const enums = (svc as any).resolveEnums();
    expect(enums.collections).toContain('CombinedInDetTracks');
    expect(enums.collections).not.toContain('Tracks');
  });
});

/**
 * THE WHOLE COMMAND CORPUS, DRIVEN THROUGH ask().
 *
 * nl-command-phrasings.test.ts checks these against keywordFallback, one layer
 * below what ships, and not one of its 95 phrases carries a question mark. That
 * is why it stayed green while ask("next event?") returned a definition with
 * ok:true and never ran the command. This drives every phrasing through the
 * real ask(), with and without a trailing "?", against a registry over a
 * recording host, and asserts the command actually EXECUTED (the registry emits
 * command-executed only after a handler has run).
 */
const COMMAND_PHRASINGS: { command: string; phrases: string[] }[] = [
  {
    command: 'next-event',
    phrases: [
      'next event',
      'next',
      'go to the next event',
      'show me the next event',
      'move to the next event',
      'can i see the next event',
      'lets see the next one',
      'next collision please',
      'advance to the next event',
      'skip to the next event',
      'i want the next event',
      'nex event',
      'next evnt',
    ],
  },
  {
    command: 'previous-event',
    phrases: [
      'previous event',
      'go back',
      'go back one event',
      'previous',
      'show the previous event',
      'take me back to the last event',
      'i want to see the previous event',
      'prev event',
      'previus event',
    ],
  },
  {
    command: 'set-theme',
    phrases: [
      'dark mode',
      'switch to dark mode',
      'make it dark',
      'turn on dark mode',
      'i prefer dark mode',
      'can you make the background dark',
      'night mode please',
      'dark theme',
      'darkmode',
      'drak mode',
    ],
  },
  {
    command: 'toggle-auto-rotate',
    phrases: [
      'spin the detector',
      'make it spin',
      'rotate the detector',
      'start spinning',
      'can you spin it',
      'auto rotate',
      'turn on auto rotate',
      'keep it rotating',
      'spin it around',
      'stop spinning',
      'stop the rotation',
      'please stop rotating',
      'spinn the detector',
    ],
  },
  {
    command: 'show-axis',
    phrases: [
      'show the axes',
      'show axis',
      'display the axes',
      'turn on the axes',
      'i want to see the axes',
      'can you show the axis',
      'hide the axes',
      'turn off the axis',
      'remove the axes',
      'show the axies',
    ],
  },
  {
    command: 'zoom',
    phrases: [
      'zoom in',
      'zoom out',
      'zoom in closer',
      'can you zoom in',
      'zoom out a bit',
      'zoom in please',
      'zoom out further',
      'zoomin',
    ],
  },
  {
    command: 'set-clipping',
    phrases: [
      'turn on clipping',
      'enable clipping',
      'clip the detector',
      'can you clip it',
      'turn off clipping',
      'disable clipping',
      'remove the clipping',
      'cliping on',
    ],
  },
  {
    command: 'toggle-camera-projection',
    phrases: [
      'switch to orthographic',
      'use orthographic',
      'orthographic view',
      'switch the projection',
      'change the camera projection',
      'use a perspective camera',
      'perspective view',
      'orthograpic',
    ],
  },
  {
    command: 'preset-view',
    phrases: ['go to the left view', 'take me to the left view'],
  },
];

/** The live names the service resolves for this harness. */
const LIVE = { presetViews: ['Left View'], geometryParts: ['Beam'] };

/** A registry over a recording host, plus the commands that actually ran. */
function commandHarness() {
  const calls: Record<string, any[][]> = {};
  const executed: string[] = [];
  const rec =
    (n: string, r?: any) =>
    (...a: any[]) => {
      (calls[n] ??= []).push(a);
      return r;
    };
  let orthographic = false;
  const registry = new CommandRegistry({
    eventDisplay: {
      nextEvent: rec('nextEvent'),
      previousEvent: rec('previousEvent'),
      loadEvent: rec('loadEvent'),
      zoomTo: rec('zoomTo'),
      highlightObject: rec('highlightObject'),
      lookAtObject: rec('lookAtObject'),
      getCollections: () => ({ Tracks: ['CombinedInDetTracks'] }),
      getCollection: rec('getCollection', [{ uuid: 'u1' }]),
      getCurrentEventKey: () => 'run/1',
      getEventMetadata: () => [],
    },
    ui: {
      setDarkTheme: rec('setDarkTheme'),
      setAutoRotate: rec('setAutoRotate'),
      setClipping: rec('setClipping'),
      setShowAxis: rec('setShowAxis'),
      geometryVisibility: rec('geometryVisibility'),
      displayView: rec('displayView'),
      getPresetViews: () => [{ name: 'Left View' }],
    },
    three: {
      revertMainCamera: () => {
        orthographic = !orthographic;
        (calls['revertMainCamera'] ??= []).push([]);
        return orthographic;
      },
      isMainCameraOrthographic: () => orthographic,
    },
    state: {},
    emit: (name: string, payload: any) => {
      if (name === COMMAND_EXECUTED_EVENT) executed.push(payload.name);
    },
    resolveObject: () => ({ uuid: 'u1' }),
    listGeometryParts: () => LIVE.geometryParts,
  } as any);
  registerDefaultCommands(registry);
  const svc = new NaturalLanguageService({
    getCommandRegistry: () => registry,
    getCollections: () => ({ Tracks: ['CombinedInDetTracks'] }),
    getUIManager: () => ({ getPresetViews: () => [{ name: 'Left View' }] }),
    getEventsData: () => ({ 'run/1': {} }),
    getGeometryPartNames: () => LIVE.geometryParts,
  } as any);
  return { svc, executed, calls };
}

/**
 * Drive every phrasing (bare and with a trailing "?") through an ask
 * implementation and report what did not happen.
 *
 * The expectation for a phrasing is set by the deterministic matcher on the
 * BARE text: if it maps, ask() must run that command whether or not a question
 * mark was typed; if it declines, ask() must not run anything and must not
 * claim a command.
 */
async function routingFailures(
  makeAsk: (svc: NaturalLanguageService) => (t: string) => Promise<NlOutcome>,
): Promise<{ failures: string[]; executedCount: number; declined: number }> {
  const failures: string[] = [];
  let executedCount = 0;
  let declined = 0;
  for (const { command, phrases } of COMMAND_PHRASINGS) {
    for (const phrase of phrases) {
      const mapped = keywordFallback(phrase, LIVE)?.command ?? null;
      for (const text of [phrase, `${phrase}?`]) {
        const { svc, executed } = commandHarness();
        const out = await makeAsk(svc)(text);
        if (mapped === command) {
          executedCount++;
          if (
            !out.ok ||
            out.command !== command ||
            executed.join() !== command ||
            out.answer
          ) {
            failures.push(
              `"${text}" expected to run ${command}, got ok=${out.ok} command=${out.command ?? 'none'} ran=[${executed}]${out.answer ? ' answer=' + JSON.stringify(out.answer.title) : ''}`,
            );
          }
        } else {
          declined++;
          if (executed.length || out.command) {
            failures.push(
              `"${text}" was not understood by the matcher but ask ran [${executed}] / claimed ${out.command}`,
            );
          }
        }
      }
    }
  }
  return { failures, executedCount, declined };
}

describe('ask() runs the command for every phrasing, with or without a "?"', () => {
  it('drives the whole command corpus through the shipping path', async () => {
    const report = await routingFailures((svc) => (t) => svc.ask(t));
    console.log(
      `ask routing: ${report.executedCount} phrasings expected to execute, ${report.declined} expected to decline, ${report.failures.length} failures`,
    );
    expect(report.failures).toEqual([]);
    // Not vacuous: most phrasings really do reach a command.
    expect(report.executedCount).toBeGreaterThan(120);
  });

  it('NEGATIVE CONTROL: the old routing (a "?" wins over the matcher) is caught', async () => {
    // Reproduces the shipped bug with the real functions: take the tutor branch
    // whenever isConceptQuestion is true, which a trailing "?" alone satisfies.
    const oldAsk =
      (svc: NaturalLanguageService) =>
      async (text: string): Promise<NlOutcome> => {
        if (isConceptQuestion(text)) {
          const answered = (svc as any).tryAnswer(text);
          if (answered) return answered;
          return { ok: false, none: true };
        }
        return svc.ask(text);
      };
    const report = await routingFailures(oldAsk);
    expect(report.failures.length).toBeGreaterThan(0);
    expect(report.failures.join('\n')).toContain('"next event?"');
  });
});
