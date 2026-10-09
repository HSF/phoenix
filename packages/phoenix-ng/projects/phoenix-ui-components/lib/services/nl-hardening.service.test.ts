import {
  CommandRegistry,
  registerDefaultCommands,
} from 'phoenix-event-display';
import { NaturalLanguageService } from './natural-language.service';

/**
 * Service-level defects found by the review of this branch, each asserted on
 * the service that ships rather than on the helper it calls.
 */

/** A phrase the deterministic matcher cannot map, so the model path runs. */
const UNMAPPABLE = 'advance to whatever comes after this collision';

function makeService(three: Record<string, unknown> = {}) {
  const registry = new CommandRegistry({
    eventDisplay: {},
    ui: {},
    three: {},
    state: {},
    emit: () => undefined,
    resolveObject: () => undefined,
    listGeometryParts: () => [],
  } as any);
  registerDefaultCommands(registry);
  const svc = Object.create(
    NaturalLanguageService.prototype,
  ) as NaturalLanguageService;
  (svc as any).eventDisplay = {
    getCommandRegistry: () => registry,
    getThreeManager: () => three,
    getCollections: () => ({}),
    getUIManager: () => ({ getPresetViews: () => [] }),
    getEventsData: () => ({}),
    getGeometryPartNames: () => [],
  };
  (svc as any).knowledgeCache = null;
  (svc as any).knowledgeSignature = '';
  return svc;
}

describe('text is bounded and cleaned before the model reads it', () => {
  // The deterministic paths stripped invisible characters and capped length,
  // but interpret() handed the RAW text to the model: a pasted string could
  // read as one request and carry another in Unicode Tag characters, and a
  // 400 KB paste went to a ~4K-context model while rendering was paused.
  const hidden =
    '\u200B\u200F\uFEFF' + String.fromCodePoint(0xe0041, 0xe0042, 0xe0043);

  it('interpret() passes sanitised, bounded text to the engine', async () => {
    const svc = makeService();
    const seen: string[] = [];
    svc.setEngine({
      interpret: async (text: string) => {
        seen.push(text);
        return { command: 'none', args: {} };
      },
    });
    await svc.interpret(UNMAPPABLE + hidden + ' filler'.repeat(60000));
    expect(seen).toHaveLength(1);
    expect(seen[0].length).toBeLessThanOrEqual(400);
    expect(seen[0]).not.toMatch(
      /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/,
    );
    expect(/[\u{E0000}-\u{E007F}]/u.test(seen[0])).toBe(false);
    expect(seen[0].startsWith(UNMAPPABLE)).toBe(true);
  });

  it('ask() does the same on its way to the model', async () => {
    const svc = makeService();
    const seen: string[] = [];
    svc.setEngine({
      interpret: async (text: string) => {
        seen.push(text);
        return { command: 'none', args: {} };
      },
    });
    await svc.ask(UNMAPPABLE + hidden);
    expect(seen.length).toBeGreaterThan(0);
    for (const text of seen) {
      expect(/[\u{E0000}-\u{E007F}]/u.test(text)).toBe(false);
    }
  });
});

describe('enabling the model is single-flight', () => {
  // Two clicks on "Enable local AI" before the first load resolved started two
  // Workers and two ~1.5 GB model downloads; the first engine was overwritten
  // without being terminated.
  it('a second enable while the first is loading does not start another load', async () => {
    const svc = makeService();
    let release!: (engine: unknown) => void;
    const factory = jest.fn(
      () => new Promise((resolve) => (release = resolve as any)),
    );
    (svc as any).engineFactory = factory;
    (svc as any).hasWebGpuAdapter = async () => true;

    const first = svc.enableModel();
    const second = svc.enableModel();
    await new Promise((r) => setTimeout(r, 0));
    release({ interpret: async () => ({ command: 'none', args: {} }) });
    await Promise.all([first, second]);

    expect(factory).toHaveBeenCalledTimes(1);
    expect(svc.hasEngine).toBe(true);
  });

  it('a failed load does not block a later retry', async () => {
    const svc = makeService();
    const factory = jest
      .fn()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce({
        interpret: async () => ({ command: 'none', args: {} }),
      });
    (svc as any).engineFactory = factory;
    (svc as any).hasWebGpuAdapter = async () => true;

    await expect(svc.enableModel()).rejects.toThrow('network down');
    await svc.enableModel();
    expect(factory).toHaveBeenCalledTimes(2);
    expect(svc.hasEngine).toBe(true);
  });
});

describe('the render loop is resumed outside the Angular zone', () => {
  // EventDisplayService registers the render loop outside Angular on purpose,
  // to avoid ~60 change-detection passes a second. Resuming it from inside the
  // zone re-armed requestAnimationFrame in the zone, and three re-arms it from
  // its own callback, so every later frame ticked the whole app, permanently.
  function zoneSpy() {
    let outside = false;
    const where: string[] = [];
    const ngZone = {
      runOutsideAngular: (fn: () => unknown) => {
        outside = true;
        try {
          return fn();
        } finally {
          outside = false;
        }
      },
    };
    const three = {
      pauseRendering: jest.fn(),
      resumeRendering: jest.fn(() =>
        where.push(outside ? 'outside-angular' : 'inside-angular'),
      ),
    };
    return { ngZone, three, where };
  }

  it('after a successful inference', async () => {
    const { ngZone, three, where } = zoneSpy();
    const svc = makeService(three);
    (svc as any).ngZone = ngZone;
    svc.setEngine({ interpret: async () => ({ command: 'none', args: {} }) });
    await svc.interpret(UNMAPPABLE);
    expect(three.pauseRendering).toHaveBeenCalledTimes(1);
    expect(where).toEqual(['outside-angular']);
  });

  it('after a failed inference too', async () => {
    const { ngZone, three, where } = zoneSpy();
    const svc = makeService(three);
    (svc as any).ngZone = ngZone;
    svc.setEngine({
      interpret: async () => {
        throw new Error('GPU lost');
      },
    });
    await svc.interpret(UNMAPPABLE);
    expect(where).toEqual(['outside-angular']);
  });

  it('still resumes when no zone is available (non-Angular hosts, tests)', async () => {
    const three = { pauseRendering: jest.fn(), resumeRendering: jest.fn() };
    const svc = makeService(three);
    svc.setEngine({ interpret: async () => ({ command: 'none', args: {} }) });
    await svc.interpret(UNMAPPABLE);
    expect(three.resumeRendering).toHaveBeenCalledTimes(1);
  });
});
