import {
  CommandRegistry,
  registerDefaultCommands,
  ThreeManager,
} from 'phoenix-event-display';
import { NaturalLanguageService } from './natural-language.service';

/**
 * OVERLAPPING model requests must not resume rendering early.
 *
 * The refcount bug lived in the COMPOSITION: each interpret() pauses and
 * resumes around its own inference, and with a boolean flag the first request
 * to finish resumed the render loop while the second was still running on the
 * GPU. render-pause.test.ts checks ThreeManager's counter in isolation and the
 * service tests only ever drive one request, so nothing exercised the two
 * together. This drives two overlapping interpret() calls through the real
 * service against the real ThreeManager pause/resume, with an engine whose
 * promises are settled by hand, and records the render loop at every step.
 */

/** Both texts must miss the keyword matcher so they take the model path. */
const TEXT_A = 'advance to whatever comes after this collision';
const TEXT_B = 'make the calorimeter invisible please';

interface Loop {
  /** Every value handed to setAnimationLoop, in order. */
  loops: (null | (() => void))[];
  pause: jest.Mock;
  resume: jest.Mock;
  manager: any;
}

/** The REAL ThreeManager pause/resume over a renderer that records the loop. */
function realManager(): Loop {
  const loops: Loop['loops'] = [];
  const tm = Object.create(ThreeManager.prototype) as any;
  tm.rendererManager = {
    getMainRenderer: () => ({ setAnimationLoop: (fn: any) => loops.push(fn) }),
  };
  tm.animationLoop = () => undefined;
  tm.renderPauseCount = 0;
  return spyOn(tm, loops);
}

/** The pre-fix behaviour: a boolean paused flag instead of a count. */
function booleanManager(): Loop {
  const loops: Loop['loops'] = [];
  let paused = false;
  const loop = () => undefined;
  const tm = {
    pauseRendering() {
      if (paused) return;
      paused = true;
      loops.push(null);
    },
    resumeRendering() {
      if (!paused) return;
      paused = false;
      loops.push(loop);
    },
  };
  return spyOn(tm, loops);
}

function spyOn(tm: any, loops: Loop['loops']): Loop {
  const pause = jest.fn(tm.pauseRendering.bind(tm));
  const resume = jest.fn(tm.resumeRendering.bind(tm));
  return {
    loops,
    pause,
    resume,
    manager: { pauseRendering: pause, resumeRendering: resume },
  };
}

/** Rendering is on unless the most recent loop change set it to null. */
const rendering = (l: Loop) =>
  l.loops.length === 0 || l.loops[l.loops.length - 1] !== null;

const flush = () => new Promise((r) => setTimeout(r, 0));

interface Deferred {
  resolve: (v: unknown) => void;
  reject: (e: unknown) => void;
}

type Settle = 'resolve' | 'reject';

interface Trace {
  renderingWhileBothRun: boolean;
  renderingAfterFirstSettles: boolean;
  renderingAfterBothSettle: boolean;
  pauses: number;
  resumes: number;
}

/**
 * Start A then B, settle them in the given order, and trace the render loop.
 * `start` is the seam: the real service by default, or a tampered one.
 */
async function overlap(
  loop: Loop,
  order: [first: 'A' | 'B', how: Settle][],
  start?: (text: string, engine: any) => Promise<unknown>,
  ngZone: any = null,
): Promise<Trace> {
  const pending: Record<string, Deferred> = {};
  const engine = {
    interpret: jest.fn(
      (text: string) =>
        new Promise((resolve, reject) => {
          pending[text === TEXT_A ? 'A' : 'B'] = { resolve, reject };
        }),
    ),
  };
  const registry = new CommandRegistry({
    eventDisplay: { nextEvent: () => undefined },
    ui: {},
    three: {},
    state: {},
    emit: () => undefined,
    resolveObject: () => undefined,
    listGeometryParts: () => [],
  } as any);
  registerDefaultCommands(registry);
  const svc = new NaturalLanguageService(
    {
      getCommandRegistry: () => registry,
      getThreeManager: () => loop.manager,
    } as any,
    null,
    ngZone,
  );
  svc.setEngine(engine);
  const run = start ?? ((text: string) => svc.interpret(text));

  const runs = { A: run(TEXT_A, engine), B: run(TEXT_B, engine) };
  await flush();
  if (engine.interpret.mock.calls.length !== 2) {
    throw new Error('both requests must be running on the model at once');
  }
  const renderingWhileBothRun = rendering(loop);

  const [[first, firstHow], [second, secondHow]] = order;
  const settle = (key: 'A' | 'B', how: Settle) =>
    how === 'resolve'
      ? pending[key].resolve({ command: 'next-event', args: {} })
      : pending[key].reject(new Error('gpu device lost'));

  settle(first, firstHow);
  await runs[first].catch(() => undefined);
  await flush();
  const renderingAfterFirstSettles = rendering(loop);

  settle(second, secondHow);
  await runs[second].catch(() => undefined);
  await flush();

  return {
    renderingWhileBothRun,
    renderingAfterFirstSettles,
    renderingAfterBothSettle: rendering(loop),
    pauses: loop.pause.mock.calls.length,
    resumes: loop.resume.mock.calls.length,
  };
}

/** What a correct composition looks like, whichever order they finish in. */
const SAFE: Trace = {
  renderingWhileBothRun: false,
  renderingAfterFirstSettles: false,
  renderingAfterBothSettle: true,
  pauses: 2,
  resumes: 2,
};

describe('overlapping model requests keep rendering paused until both finish', () => {
  const orders: [string, ['A' | 'B', Settle][]][] = [
    [
      'A resolves, then B resolves',
      [
        ['A', 'resolve'],
        ['B', 'resolve'],
      ],
    ],
    [
      'B resolves first, then A',
      [
        ['B', 'resolve'],
        ['A', 'resolve'],
      ],
    ],
    [
      'A rejects, then B resolves',
      [
        ['A', 'reject'],
        ['B', 'resolve'],
      ],
    ],
    [
      'A resolves, then B rejects',
      [
        ['A', 'resolve'],
        ['B', 'reject'],
      ],
    ],
    [
      'both reject',
      [
        ['A', 'reject'],
        ['B', 'reject'],
      ],
    ],
  ];

  for (const [label, order] of orders) {
    it(label, async () => {
      expect(await overlap(realManager(), order)).toEqual(SAFE);
    });
  }

  it('the same holds when resume is routed outside the Angular zone', async () => {
    // The service resumes through NgZone.runOutsideAngular when a zone is
    // injected; routing must not change the balance.
    let outside = 0;
    const zone = {
      runOutsideAngular: (fn: () => unknown) => {
        outside++;
        return fn();
      },
    };
    const trace = await overlap(
      realManager(),
      [
        ['A', 'reject'],
        ['B', 'resolve'],
      ],
      undefined,
      zone,
    );
    expect(trace).toEqual(SAFE);
    expect(outside).toBe(2);
  });

  it('NEGATIVE CONTROL: a boolean pause flag resumes while the second request still runs', async () => {
    // Stands in for reverting ThreeManager's refcount to the original boolean.
    const trace = await overlap(booleanManager(), [
      ['A', 'resolve'],
      ['B', 'resolve'],
    ]);
    expect(trace).not.toEqual(SAFE);
    expect(trace.renderingAfterFirstSettles).toBe(true);
  });

  it('NEGATIVE CONTROL: a service that resumes before inference finishes is caught', async () => {
    // Stands in for moving resumeRendering out of `finally` to before the
    // await: rendering comes back while both models are still running.
    const early = async (text: string, engine: any) => {
      loopUnderTest.manager.pauseRendering();
      loopUnderTest.manager.resumeRendering();
      return engine.interpret(text);
    };
    const loopUnderTest = realManager();
    const trace = await overlap(
      loopUnderTest,
      [
        ['A', 'resolve'],
        ['B', 'resolve'],
      ],
      early,
    );
    expect(trace).not.toEqual(SAFE);
    expect(trace.renderingWhileBothRun).toBe(true);
  });

  it('NEGATIVE CONTROL: a service that does not resume on a rejected inference is caught', async () => {
    // Stands in for dropping `finally`: a model error leaves the scene frozen.
    const noFinally = async (text: string, engine: any) => {
      loopUnderTest.manager.pauseRendering();
      const out = await engine.interpret(text);
      loopUnderTest.manager.resumeRendering();
      return out;
    };
    const loopUnderTest = realManager();
    const trace = await overlap(
      loopUnderTest,
      [
        ['A', 'reject'],
        ['B', 'resolve'],
      ],
      noFinally,
    );
    expect(trace).not.toEqual(SAFE);
    expect(trace.renderingAfterBothSettle).toBe(false);
  });
});
