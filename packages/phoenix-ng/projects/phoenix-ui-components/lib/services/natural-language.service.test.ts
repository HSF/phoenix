import { NaturalLanguageService, NlEngine } from './natural-language.service';
import {
  CommandRegistry,
  registerDefaultCommands,
} from 'phoenix-event-display';

/** Build a real registry over a recording host so execute() truly runs. */
function makeRegistry() {
  const calls: any = {
    setDarkTheme: jest.fn(),
    nextEvent: jest.fn(),
    setAutoRotate: jest.fn(),
    emit: jest.fn(),
  };
  const host: any = {
    eventDisplay: {
      nextEvent: calls.nextEvent,
      previousEvent: jest.fn(),
      loadEvent: jest.fn(),
      zoomTo: jest.fn(),
      highlightObject: jest.fn(),
      lookAtObject: jest.fn(),
      getCollections: jest.fn(() => ({ Tracks: [{}], Hits: [{}] })),
      getCollection: jest.fn(() => [{ uuid: 'u0' }]),
      getCurrentEventKey: jest.fn(() => 'e1'),
      getEventMetadata: jest.fn(() => [{}]),
    },
    ui: {
      setDarkTheme: calls.setDarkTheme,
      setAutoRotate: calls.setAutoRotate,
      setClipping: jest.fn(),
      setShowAxis: jest.fn(),
      geometryVisibility: jest.fn(),
      getPresetViews: jest.fn(() => [{ name: 'Front' }]),
      displayView: jest.fn(),
    },
    three: { revertMainCamera: jest.fn() },
    state: {},
    emit: calls.emit,
    resolveObject: jest.fn((_c: string, i: number) =>
      i === 0 ? { uuid: 'u0' } : undefined,
    ),
    listGeometryParts: () => ['LAr Barrel'],
  };
  const registry = new CommandRegistry(host);
  registerDefaultCommands(registry);
  return { registry, calls };
}

function makeService(registry: CommandRegistry) {
  const eventDisplay: any = {
    getCommandRegistry: () => registry,
    getCollections: () => ({ Tracks: [{}], Hits: [{}] }),
    getUIManager: () => ({ getPresetViews: () => [{ name: 'Front' }] }),
    getEventsData: () => ({ e1: {}, e2: {} }),
  };
  return new NaturalLanguageService(eventDisplay);
}

describe('NaturalLanguageService (fallback path, no model)', () => {
  it('runs a keyword-mapped command end-to-end through the registry', async () => {
    const { registry, calls } = makeRegistry();
    const svc = makeService(registry);
    const out = await svc.ask('switch to dark theme');
    expect(out.ok).toBe(true);
    expect(out.command).toBe('set-theme');
    expect(out.usedFallback).toBe(true);
    expect(calls.setDarkTheme).toHaveBeenCalledWith(true);
  });

  it('interpret() maps a request WITHOUT executing it (side-effect-free dry run)', async () => {
    const { registry, calls } = makeRegistry();
    const svc = makeService(registry);
    const out = await svc.interpret('switch to dark theme');
    expect(out.ok).toBe(true);
    expect(out.command).toBe('set-theme');
    expect(out.usedFallback).toBe(true);
    expect(calls.setDarkTheme).not.toHaveBeenCalled();
  });

  it('reports a no-match (without firing anything) for an unmappable request', async () => {
    const { registry, calls } = makeRegistry();
    const svc = makeService(registry);
    const out = await svc.ask('make me a sandwich');
    expect(out.ok).toBe(false);
    expect(out.none).toBe(true);
    expect(calls.setDarkTheme).not.toHaveBeenCalled();
    expect(calls.nextEvent).not.toHaveBeenCalled();
  });
});

describe('NaturalLanguageService (model path)', () => {
  it('uses the engine when one is set, and executes its interpreted command', async () => {
    const { registry, calls } = makeRegistry();
    const svc = makeService(registry);
    const engine: NlEngine = {
      interpret: jest.fn(async () => ({ command: 'next-event', args: {} })),
    };
    svc.setEngine(engine);
    // Deliberately a phrasing the deterministic matcher CANNOT map, since the
    // fast path short-circuits before the engine whenever it recognises the
    // request. ("go forward one event" used to serve here, until the matcher
    // learned it, at which point this test was silently exercising the wrong
    // path.)
    const out = await svc.ask('advance to whatever comes after this collision');
    expect(engine.interpret).toHaveBeenCalled();
    expect(out.ok).toBe(true);
    expect(out.command).toBe('next-event');
    expect(out.usedFallback).toBe(false);
    expect(calls.nextEvent).toHaveBeenCalled();
  });

  it('passes a constrained schema + system prompt (mentioning commands) to the engine', async () => {
    const { registry } = makeRegistry();
    const svc = makeService(registry);
    const interpret = jest.fn(async () => ({ command: 'none', args: {} }));
    svc.setEngine({ interpret });
    await svc.ask('do something');
    const [, schema, prompt] = interpret.mock.calls[0];
    expect(JSON.parse(schema).oneOf.length).toBeGreaterThan(1);
    expect(prompt).toContain('set-theme');
  });

  it('resolves live enumSource values into the schema (collections become concrete)', async () => {
    const { registry } = makeRegistry();
    // getCollections() returns { type: [collectionName, ...] }. The enum must
    // hold the collection NAMES, which is what getCollection() resolves; the
    // type keys are not addressable (see ask-routing.service.test.ts). This
    // test used to pin the type keys and went red when that bug was fixed.
    const eventDisplay: any = {
      getCommandRegistry: () => registry,
      getCollections: () => ({
        Tracks: ['CombinedInDetTracks'],
        Hits: ['MDT', 'RPC'],
      }),
    };
    const svc = new NaturalLanguageService(eventDisplay);
    const interpret = jest.fn(async () => ({ command: 'none', args: {} }));
    svc.setEngine({ interpret });
    await svc.ask('highlight a track');
    const schema = JSON.parse(interpret.mock.calls[0][1]);
    const hi = schema.oneOf.find(
      (b: any) => b.properties.command.const === 'highlight-object',
    );
    expect(hi.properties.args.properties.collection.enum).toEqual([
      'CombinedInDetTracks',
      'MDT',
      'RPC',
    ]);
  });

  it('falls back to keyword mapping when the engine throws', async () => {
    const { registry, calls } = makeRegistry();
    const svc = makeService(registry);
    svc.setEngine({
      interpret: jest.fn(async () => {
        throw new Error('model boom');
      }),
    });
    const out = await svc.ask('dark theme');
    expect(out.ok).toBe(true);
    expect(out.usedFallback).toBe(true);
    expect(calls.setDarkTheme).toHaveBeenCalledWith(true);
  });

  it('rejects an engine-proposed command that is not registered (never executes it)', async () => {
    const { registry, calls } = makeRegistry();
    const svc = makeService(registry);
    svc.setEngine({
      interpret: jest.fn(async () => ({ command: 'delete-all', args: {} })),
    });
    const out = await svc.ask('delete everything');
    expect(out.ok).toBe(false);
    expect(calls.nextEvent).not.toHaveBeenCalled();
    expect(calls.setDarkTheme).not.toHaveBeenCalled();
  });

  it('rejects engine output with invalid args (type mismatch)', async () => {
    const { registry, calls } = makeRegistry();
    const svc = makeService(registry);
    svc.setEngine({
      interpret: jest.fn(async () => ({
        command: 'set-theme',
        args: { dark: 'yes' },
      })),
    });
    const out = await svc.ask('theme');
    expect(out.ok).toBe(false);
    expect(calls.setDarkTheme).not.toHaveBeenCalled();
  });
});

describe('NaturalLanguageService (render pause during inference)', () => {
  function serviceWithThree(pause: jest.Mock, resume: jest.Mock) {
    const { registry } = makeRegistry();
    const eventDisplay: any = {
      getCommandRegistry: () => registry,
      getThreeManager: () => ({
        pauseRendering: pause,
        resumeRendering: resume,
      }),
    };
    return new NaturalLanguageService(eventDisplay);
  }

  it('pauses rendering WHILE the model runs, then resumes (frees the GPU)', async () => {
    const pause = jest.fn();
    const resume = jest.fn();
    const svc = serviceWithThree(pause, resume);
    let pausedDuringInference = false;
    svc.setEngine({
      interpret: jest.fn(async () => {
        pausedDuringInference =
          pause.mock.calls.length === 1 && resume.mock.calls.length === 0;
        return { command: 'next-event', args: {} };
      }),
    });
    await svc.interpret('go forward');
    expect(pausedDuringInference).toBe(true);
    expect(resume).toHaveBeenCalledTimes(1);
  });

  it('resumes rendering even when the model throws (never leaves it paused)', async () => {
    const pause = jest.fn();
    const resume = jest.fn();
    const svc = serviceWithThree(pause, resume);
    svc.setEngine({
      interpret: jest.fn(async () => {
        throw new Error('gpu boom');
      }),
    });
    await svc.interpret('make the calorimeter invisible'); // model path
    expect(pause).toHaveBeenCalledTimes(1);
    expect(resume).toHaveBeenCalledTimes(1);
  });

  it('does not pause on the keyword-only path (no model, no GPU work)', async () => {
    const pause = jest.fn();
    const resume = jest.fn();
    const svc = serviceWithThree(pause, resume);
    await svc.interpret('next event'); // no engine set
    expect(pause).not.toHaveBeenCalled();
    expect(resume).not.toHaveBeenCalled();
  });

  it('never throws when no three manager is present', async () => {
    const { registry } = makeRegistry();
    const svc = new NaturalLanguageService({
      getCommandRegistry: () => registry,
    } as any);
    svc.setEngine({
      interpret: jest.fn(async () => ({ command: 'next-event', args: {} })),
    });
    await expect(svc.interpret('go forward')).resolves.toBeTruthy();
  });
});

describe('NaturalLanguageService (WebGPU support)', () => {
  it('reflects navigator.gpu availability', () => {
    const { registry } = makeRegistry();
    const svc = makeService(registry);
    const original = (navigator as any).gpu;
    (navigator as any).gpu = {};
    expect(svc.isSupported()).toBe(true);
    (navigator as any).gpu = undefined;
    expect(svc.isSupported()).toBe(false);
    (navigator as any).gpu = original;
  });
});

describe('NaturalLanguageService (model availability + opt-in)', () => {
  const eventDisplay: any = {
    getCommandRegistry: () => makeRegistry().registry,
  };

  it('is not model-available without an engine factory (fallback only)', () => {
    const svc = new NaturalLanguageService(eventDisplay, null);
    (navigator as any).gpu = {};
    expect(svc.isModelAvailable()).toBe(false);
  });

  it('is model-available only with BOTH a factory and WebGPU', () => {
    const factory = jest.fn();
    const svc = new NaturalLanguageService(eventDisplay, factory as any);
    const original = (navigator as any).gpu;
    (navigator as any).gpu = {};
    expect(svc.isModelAvailable()).toBe(true);
    (navigator as any).gpu = undefined;
    expect(svc.isModelAvailable()).toBe(false);
    (navigator as any).gpu = original;
  });

  it('enableModel loads the engine via the provided factory (adapter present)', async () => {
    const engine: NlEngine = { interpret: jest.fn(async () => ({})) };
    const factory = jest.fn(async () => engine);
    const svc = new NaturalLanguageService(eventDisplay, factory);
    const original = (navigator as any).gpu;
    (navigator as any).gpu = { requestAdapter: async () => ({}) };
    await svc.enableModel();
    expect(factory).toHaveBeenCalled();
    expect(svc.hasEngine).toBe(true);
    expect(svc.status).toBe('ready');
    (navigator as any).gpu = original;
  });

  it('enableModel fails fast (no download) when there is no WebGPU adapter', async () => {
    const factory = jest.fn(async () => ({ interpret: jest.fn() }));
    const svc = new NaturalLanguageService(eventDisplay, factory);
    const original = (navigator as any).gpu;
    (navigator as any).gpu = { requestAdapter: async () => null };
    await svc.enableModel();
    expect(factory).not.toHaveBeenCalled();
    expect(svc.hasEngine).toBe(false);
    expect(svc.status).toBe('error');
    (navigator as any).gpu = original;
  });

  it('enableModel is a no-op when no factory was provided', async () => {
    const svc = new NaturalLanguageService(eventDisplay, null);
    await svc.enableModel();
    expect(svc.hasEngine).toBe(false);
  });
});

describe('NaturalLanguageService (tutor: "what is..." questions)', () => {
  it('answers a physics question from the vetted knowledge base (no command runs)', async () => {
    const { registry, calls } = makeRegistry();
    const svc = makeService(registry);
    const out = await svc.ask('what is a track?');
    expect(out.ok).toBe(true);
    expect(out.answer?.title).toBe('Track');
    expect(out.answer?.body.length).toBeGreaterThan(40);
    expect(out.command).toBeUndefined();
    expect(calls.nextEvent).not.toHaveBeenCalled();
    expect(calls.setDarkTheme).not.toHaveBeenCalled();
  });

  it('answers a Phoenix-feature question', async () => {
    const { registry } = makeRegistry();
    const svc = makeService(registry);
    const out = await svc.ask('what is eta-phi');
    expect(out.ok).toBe(true);
    expect(out.answer?.title).toBe('Eta-phi view');
  });

  it('includes related topics and a valid suggested action when the concept maps to one', async () => {
    const { registry } = makeRegistry();
    const svc = makeService(registry);
    const out = await svc.ask('what is dark mode');
    expect(out.answer?.related.length).toBeGreaterThan(0);
    expect(out.answer?.action?.command).toBe('set-theme');
  });

  it('gives an honest no-answer for an unknown question (never fires a command)', async () => {
    const { registry, calls } = makeRegistry();
    const svc = makeService(registry);
    const out = await svc.ask('what is the meaning of life?');
    expect(out.ok).toBe(false);
    expect(out.none).toBe(true);
    expect(out.answer).toBeUndefined();
    expect(calls.nextEvent).not.toHaveBeenCalled();
  });

  it('still routes an ACTION (not a question) to the command path', async () => {
    const { registry, calls } = makeRegistry();
    const svc = makeService(registry);
    const out = await svc.ask('switch to dark theme');
    expect(out.answer).toBeUndefined();
    expect(out.command).toBe('set-theme');
    expect(calls.setDarkTheme).toHaveBeenCalledWith(true);
  });

  it('answers "what is THIS eta phi panel and how cani use it" (the wild bug)', async () => {
    const { registry } = makeRegistry();
    const svc = makeService(registry);
    // "this <panel>" is a question, not a live-data command; the typo "cani"
    // and the trailing how-to must not break routing or retrieval.
    const out = await svc.ask(
      'what is this eta phi panel and how cani use it ?',
    );
    expect(out.ok).toBe(true);
    expect(out.answer?.title).toBe('Eta-phi view');
  });

  it('answers a bare topic that maps to no command ("eta phi panel")', async () => {
    const { registry } = makeRegistry();
    const svc = makeService(registry);
    const out = await svc.ask('eta phi panel');
    expect(out.answer?.title).toBe('Eta-phi view');
  });

  it('answers a HOW-TO question with steps, not the definition', async () => {
    const { registry } = makeRegistry();
    const svc = makeService(registry);
    const def = await svc.ask('what is the kinematics panel');
    const how = await svc.ask('how can i use the kinematics panel ?');
    expect(how.answer?.title).toBe('Kinematics panel');
    // The whole point: a different question gets a different answer.
    expect(how.answer?.body).not.toBe(def.answer?.body);
    expect(how.answer?.body.toLowerCase()).toContain('more info');
  });

  it('answers a WHY question with the purpose', async () => {
    const { registry } = makeRegistry();
    const svc = makeService(registry);
    const why = await svc.ask('why do we use eta');
    const def = await svc.ask('what is eta');
    expect(why.answer?.body).not.toBe(def.answer?.body);
  });

  it('answers a WHERE question with the location', async () => {
    const { registry } = makeRegistry();
    const svc = makeService(registry);
    const out = await svc.ask('where is the kinematics panel');
    expect(out.answer?.body.toLowerCase()).toContain('more info');
  });

  it('answers a cross-topic task ("how do i filter tracks") with a recipe', async () => {
    const { registry } = makeRegistry();
    const svc = makeService(registry);
    const out = await svc.ask('how do i filter tracks above 20 gev');
    expect(out.answer?.title).toContain('Filtering tracks');
    expect(out.answer?.body.toLowerCase()).toContain('gear');
  });

  it('answers CERN ecosystem questions accurately', async () => {
    const { registry } = makeRegistry();
    const svc = makeService(registry);
    const out = await svc.ask('what is the lhc');
    expect(out.answer?.title).toContain('Large Hadron Collider');
    expect(out.answer?.body).toMatch(/27\s?km|26\s?659/);
  });

  it('flags when it only has a definition for a how-to question (honest)', async () => {
    const { registry } = makeRegistry();
    const svc = makeService(registry);
    // 'quark' has no how-to; the answer must still be the vetted definition
    // and must not pretend to be steps.
    const out = await svc.ask('how do i use a quark');
    expect(out.answer?.body).toBeTruthy();
    expect(out.answer?.approximate).toBe(true);
  });

  it('still routes "describe this event" to the command path (live data)', async () => {
    const { registry } = makeRegistry();
    const svc = makeService(registry);
    const out = await svc.ask('describe this event');
    expect(out.answer).toBeUndefined();
    expect(out.command).toBe('describe-event');
  });
});

describe('NaturalLanguageService (did-you-mean suggestions)', () => {
  it('offers a suggestion instead of firing when a command is mistyped', async () => {
    const { registry, calls } = makeRegistry();
    const svc = makeService(registry);
    const out = await svc.ask('drak mode');
    // Nothing ran: a typo must never mutate the display on a guess.
    expect(calls.setDarkTheme).not.toHaveBeenCalled();
    expect(out.ok).toBe(false);
    // But the student is not stranded: the likely intent is offered.
    expect(out.suggestion?.command).toBe('set-theme');
    expect(out.suggestion?.label.toLowerCase()).toContain('dark');
  });

  it('has no suggestion when the request already worked', async () => {
    const { registry } = makeRegistry();
    const svc = makeService(registry);
    const out = await svc.ask('dark mode');
    expect(out.ok).toBe(true);
    expect(out.suggestion).toBeUndefined();
  });

  it('has no suggestion for unrelated text', async () => {
    const { registry } = makeRegistry();
    const svc = makeService(registry);
    const out = await svc.ask('make me a coffee');
    expect(out.suggestion).toBeUndefined();
  });
});

describe('NaturalLanguageService (deterministic fast path)', () => {
  it('does NOT run the model for a request the keyword matcher already handles', async () => {
    const { registry, calls } = makeRegistry();
    const svc = makeService(registry);
    const interpret = jest.fn(async () => ({
      command: 'next-event',
      args: {},
    }));
    svc.setEngine({ interpret });

    const out = await svc.ask('switch to dark theme');

    // The matcher is provably correct for these phrasings, so spending a GPU
    // inference on them only risks the driver watchdog (device lost) and adds
    // seconds of latency for no accuracy gain.
    expect(interpret).not.toHaveBeenCalled();
    expect(out.command).toBe('set-theme');
    expect(calls.setDarkTheme).toHaveBeenCalledWith(true);
  });

  it('does not pause rendering when the model was not needed', async () => {
    const { registry } = makeRegistry();
    const pause = jest.fn();
    const resume = jest.fn();
    const eventDisplay: any = {
      getCommandRegistry: () => registry,
      getThreeManager: () => ({
        pauseRendering: pause,
        resumeRendering: resume,
      }),
    };
    const svc = new NaturalLanguageService(eventDisplay);
    svc.setEngine({
      interpret: jest.fn(async () => ({ command: 'none', args: {} })),
    });

    await svc.interpret('next event');

    expect(pause).not.toHaveBeenCalled();
    expect(resume).not.toHaveBeenCalled();
  });

  it('STILL uses the model when the matcher cannot read the request', async () => {
    const { registry } = makeRegistry();
    const svc = makeService(registry);
    const interpret = jest.fn(async () => ({
      command: 'set-geometry-visibility',
      args: { part: 'LAr Barrel', visible: false },
    }));
    svc.setEngine({ interpret });

    // The keyword matcher has no rule for geometry parts, so this is exactly
    // the long tail the model exists for.
    const out = await svc.interpret('make the calorimeter invisible please');

    expect(interpret).toHaveBeenCalled();
    expect(out.command).toBe('set-geometry-visibility');
  });
});

describe('NaturalLanguageService (near-miss topic suggestions)', () => {
  it('offers the topic instead of answering when a question is badly mistyped', async () => {
    const { registry } = makeRegistry();
    const svc = makeService(registry);
    const out = await svc.ask('what is a foton');
    // Not answered: the tutor will not explain something it is unsure of.
    expect(out.answer).toBeUndefined();
    // But the student is offered the topic to confirm.
    expect(out.suggestedTopic?.title).toBe('Photon');
  });

  it('answers directly when the question is clear', async () => {
    const { registry } = makeRegistry();
    const svc = makeService(registry);
    const out = await svc.ask('what is a photon');
    expect(out.answer?.title).toBe('Photon');
    expect(out.suggestedTopic).toBeUndefined();
  });

  it('offers no topic for a genuinely out-of-scope question', async () => {
    const { registry } = makeRegistry();
    const svc = makeService(registry);
    const out = await svc.ask('what is photosynthesis');
    expect(out.suggestedTopic).toBeUndefined();
    expect(out.error).toContain('No answer for that yet');
  });
});
