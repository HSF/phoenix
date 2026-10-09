import {
  keywordFallback,
  suggestCommand,
} from '../../../managers/command-registry/nl-intent';
import {
  findKnowledge,
  KNOWLEDGE_BASE,
} from '../../../managers/command-registry/knowledge-base';

/**
 * Performance budgets for the natural-language layer.
 *
 * These run on the main thread while a heavy WebGL scene is rendering, so a
 * slow matcher does not merely feel sluggish, it drops frames.
 *
 * NO ABSOLUTE MILLISECOND BUDGETS. Jest runs suites on parallel workers, and
 * CPU contention (plus GC and swap on a loaded CI box) slows every measurement
 * by an amount that has nothing to do with the code. A fixed budget therefore
 * either flakes under load or is so loose it catches nothing. Instead each
 * workload is timed against a REFERENCE workload of the same character (string
 * scanning) measured interleaved with it, in the same process under the same
 * contention, and the budget is a RATIO. Each side is the cheapest of several
 * rounds: timing noise only ever adds time, so the minimum is the estimator
 * least polluted by the scheduler.
 *
 * Every budget has a NEGATIVE CONTROL that runs a deliberately regressed
 * workload through the same measurement and proves the budget rejects it.
 */

/** A fixed string-scanning workload, the unit every budget is expressed in. */
const REF_A = Array.from({ length: 32 }, (_, i) => `calorimeter${i}`);
const REF_B = Array.from({ length: 16 }, (_, i) => `calorimetre${i}`);
function referenceWork(): number {
  // Allocation-free on purpose. A version that built strings inside the loop
  // swung between 3 and 16 ms from one test to the next in the same process
  // (its optimised code was invalidated by whatever ran before it), which moved
  // every ratio by 4x. Scanning fixed strings keeps the unit stable.
  let sink = 0;
  for (let i = 0; i < 60000; i++) {
    const a = REF_A[i & 31];
    const b = REF_B[i & 15];
    const n = a.length < b.length ? a.length : b.length;
    for (let j = 0; j < n; j++) {
      if (a.charCodeAt(j) !== b.charCodeAt(j)) sink++;
    }
  }
  return sink;
}

/**
 * Cost of `reps` runs of `fn` in reference units: cheapest of `rounds` timings
 * of the workload over cheapest of the interleaved reference timings.
 *
 * `reps` brings the workload up to the same millisecond scale as the reference.
 * A single call to these functions takes a fraction of the reference, and the
 * ratio of a 0.09 ms measurement to a 12 ms one is mostly timer noise: measured
 * that way, a forty-fold regression still looked comfortably inside budget.
 */
function costInReferenceUnits(
  fn: () => void,
  reps: number,
  rounds = 7,
): { ratio: number; ms: number; refMs: number } {
  let ms = Infinity;
  let refMs = Infinity;
  for (let r = 0; r < rounds; r++) {
    let t0 = performance.now();
    if (referenceWork() === 0) throw new Error('reference optimised away');
    refMs = Math.min(refMs, performance.now() - t0);
    t0 = performance.now();
    for (let i = 0; i < reps; i++) fn();
    ms = Math.min(ms, performance.now() - t0);
  }
  // Clamp to timer resolution so a sub-resolution reference cannot divide by 0.
  refMs = Math.max(refMs, 0.01);
  return {
    ratio: Number((ms / refMs).toFixed(3)),
    ms: Number(ms.toFixed(3)),
    refMs: Number(refMs.toFixed(3)),
  };
}

/** Verdict object, so a failure prints every number that produced it. */
function budget(
  measured: { ratio: number; ms: number; refMs: number },
  maxRatio: number,
) {
  return { tooSlow: measured.ratio > maxRatio, maxRatio, ...measured };
}

const withinBudget = expect.objectContaining({ tooSlow: false });
const overBudget = expect.objectContaining({ tooSlow: true });

/** Run `fn` n times: a stand-in for a regression that multiplies the work. */
const times = (n: number, fn: () => void) => () => {
  for (let i = 0; i < n; i++) fn();
};

const COMMANDS = [
  'dark mode',
  'next event',
  'spin the detector',
  'show the axes',
  'zoom in',
  'turn on clipping',
  'switch to orthographic',
];

const QUESTIONS = [
  'what is a jet',
  'how do i use the kinematics panel',
  'why do we use eta',
  'what is the lhc',
  'what is a calorimeter',
  'how do i filter tracks above 20 gev',
];

const commandBatch = () => {
  for (const c of COMMANDS) keywordFallback(c);
};
const questionBatch = () => {
  for (const q of QUESTIONS) findKnowledge(q);
};
const suggestions = () => {
  suggestCommand('drak mode');
  suggestCommand('nex event');
};

/**
 * Budgets, in reference units, for REPS repetitions of each workload. Each is
 * roughly five times the worst ratio measured on a loaded 6-core WSL box
 * across repeated runs of this file (the ratios still move by about 2x between
 * runs), and each negative control lands well above it, so a slow machine
 * passes and a real regression does not. The measured values are printed on
 * every run.
 */
const BUDGET = {
  commandBatch: 6,
  // Tighter than the rest on purpose. The real path measures about 1.6 (2 to
  // 2.6 under coverage) and answering without the alias index about 15 (20 to
  // 27 under coverage), but CI measured that slow path at only 9.9. At 10 the
  // negative control fell just under the line on CI and failed to fire; 5
  // keeps about 2x clear of both sides everywhere it has been measured.
  warmQuestion: 5,
  questionBatch: 12,
  suggestions: 5,
  pathological: 18,
  coldRatio: 12,
  coldBlowUp: 150,
};

/** Repetitions that bring each workload to roughly one reference unit. */
const REPS = {
  commandBatch: 20,
  warmQuestion: 30,
  questionBatch: 20,
  suggestions: 100,
  pathological: 4,
};

describe('performance budgets: the NL layer never blocks the frame', () => {
  beforeAll(() => {
    // Warm the JIT and the caches the warm-path budgets are about.
    for (let i = 0; i < 60; i++) referenceWork();
    for (let i = 0; i < 20; i++) {
      referenceWork();
      commandBatch();
      questionBatch();
      suggestions();
    }
  });

  it('command matching is far cheaper than one reference unit', () => {
    const m = costInReferenceUnits(commandBatch, REPS.commandBatch);
    console.log(`command batch ${JSON.stringify(m)}`);
    expect(budget(m, BUDGET.commandBatch)).toEqual(withinBudget);
  });

  it('NEGATIVE CONTROL: the command budget rejects a 200x slower matcher', () => {
    // Stands in for a matcher doing two hundred times the work per request.
    // The batch is so cheap (its ratio moves between 0.2 and 1 from run to
    // run) that the budget can only promise to catch a regression of this
    // order, not a small constant factor; this control states that honestly.
    const m = costInReferenceUnits(
      times(200, commandBatch),
      REPS.commandBatch,
      1,
    );
    expect(budget(m, BUDGET.commandBatch)).toEqual(overBudget);
  });

  it('a single warm question is answered in well under a reference unit', () => {
    let worst = { ratio: 0, ms: 0, refMs: 0 };
    for (const q of QUESTIONS) {
      const m = costInReferenceUnits(() => findKnowledge(q), REPS.warmQuestion);
      if (m.ratio > worst.ratio) worst = m;
    }
    console.log(`worst warm question ${JSON.stringify(worst)}`);
    expect(budget(worst, BUDGET.warmQuestion)).toEqual(withinBudget);
  });

  it('NEGATIVE CONTROL: the warm budget rejects answering without the alias index', () => {
    // Stands in for removing the alias index, so that every entry is scored
    // for every question: the question is looked up against each entry on its
    // own, which scores all of them. (Merely defeating the index CACHE with a
    // fresh copy of the base was measured at only about 2x, because the index
    // is still used as a filter, so it is not a stand-in for removal.)
    const m = costInReferenceUnits(
      () => scoreEveryEntry('how do i use the kinematics panel'),
      REPS.warmQuestion,
      1,
    );
    expect(budget(m, BUDGET.warmQuestion)).toEqual(overBudget);
  });

  it('even a batch of questions stays interactive', () => {
    const m = costInReferenceUnits(questionBatch, REPS.questionBatch);
    console.log(`question batch ${JSON.stringify(m)}`);
    expect(budget(m, BUDGET.questionBatch)).toEqual(withinBudget);
  });

  it('NEGATIVE CONTROL: the batch budget rejects a batch without the alias index', () => {
    const m = costInReferenceUnits(
      () => {
        for (const q of QUESTIONS) scoreEveryEntry(q);
      },
      REPS.questionBatch,
      1,
    );
    expect(budget(m, BUDGET.questionBatch)).toEqual(overBudget);
  });

  it('suggestion lookup (only on a miss) stays cheap', () => {
    const m = costInReferenceUnits(suggestions, REPS.suggestions);
    console.log(`suggestions ${JSON.stringify(m)}`);
    expect(budget(m, BUDGET.suggestions)).toEqual(withinBudget);
  });

  it('NEGATIVE CONTROL: the suggestion budget rejects a 40x slower lookup', () => {
    const m = costInReferenceUnits(times(40, suggestions), REPS.suggestions, 2);
    expect(budget(m, BUDGET.suggestions)).toEqual(overBudget);
  });

  it('a pathological input cannot stall the thread', () => {
    // Bounded input plus bounded matching: even a huge paste costs about what a
    // normal question does. This guards a real defect, an unbounded input that
    // once froze the tab for 116 seconds.
    const m = costInReferenceUnits(pathological, REPS.pathological, 5);
    console.log(`pathological input ${JSON.stringify(m)}`);
    expect(budget(m, BUDGET.pathological)).toEqual(withinBudget);
  });

  it('NEGATIVE CONTROL: the pathological budget rejects processing the whole paste', () => {
    // Stands in for removing the input length cap: the same paste processed in
    // full, which is what an uncapped matcher does, simulated by feeding every
    // cap-sized slice of it through the capped functions in turn. Each slice
    // gets a distinct word so no memo short-circuits the repeat work.
    const whole = () => {
      for (let i = 0; i * CAP < HUGE.length; i++) {
        const slice = `${HUGE.slice(i * CAP, (i + 1) * CAP)} w${i}x`;
        findKnowledge(slice);
        keywordFallback(slice);
        suggestCommand(slice);
      }
    };
    const m = costInReferenceUnits(whole, 1, 1);
    expect(budget(m, BUDGET.pathological)).toEqual(overBudget);
  });

  it('a question never seen before still fits the cold budget', () => {
    // The budgets above measure the WARM path. The cold path is the one a
    // student meets first: each of these introduces words the matcher has
    // never scored, so none of the caches help. Cold work cannot be repeated,
    // so each question is timed once, next to a reference measured around it.
    const { floorRatio, worstRatio, refMs } = coldCosts(UNSEEN, (q) =>
      findKnowledge(q),
    );
    console.log(
      `cold questions ${JSON.stringify({ floorRatio, worstRatio, refMs })}`,
    );
    // The floor catches an algorithmic regression; the worst-case guard is
    // generous and only catches a blow-up on one question.
    expect({
      tooSlow: floorRatio > BUDGET.coldRatio,
      blewUp: worstRatio > BUDGET.coldBlowUp,
      floorRatio,
      worstRatio,
    }).toEqual(expect.objectContaining({ tooSlow: false, blewUp: false }));
  });

  it('NEGATIVE CONTROL: the cold budget rejects a matcher doing 40x the cold work', () => {
    // Fresh copies of the base per call defeat the cached index, and repeating
    // the lookup on distinct unseen words multiplies the uncached work.
    let n = 0;
    const { floorRatio } = coldCosts(UNSEEN.slice(0, 3), (q) => {
      for (let i = 0; i < 40; i++) {
        findKnowledge(`${q} zqx${n++}`, [...KNOWLEDGE_BASE]);
      }
    });
    expect(floorRatio > BUDGET.coldRatio).toBe(true);
  });

  it('a warm session answers far cheaper than a cold one', () => {
    // What the caches are FOR: asking again must cost a fraction of asking the
    // first time. Both sides are measured here, so this ratio needs no
    // reference at all and cannot drift with machine speed.
    const q = 'why do particle physicists histogram the dijet invariant mass';
    const t0 = performance.now();
    findKnowledge(q);
    const cold = performance.now() - t0;
    const warm = costInReferenceUnits(() => findKnowledge(q), 1).ms;
    const ratio = warm / Math.max(cold, 0.01);
    console.log(`warm/cold ${JSON.stringify({ warm, cold, ratio })}`);
    expect({ cachesHelp: ratio < 0.5, warm, cold }).toEqual(
      expect.objectContaining({ cachesHelp: true }),
    );
  });

  it('NEGATIVE CONTROL: the warm/cold check rejects a session without caches', () => {
    // Stands in for the caches being removed: the "warm" call gets a fresh
    // base and fresh words, so it pays cold work again. The same ratio check
    // must fail.
    let n = 0;
    const ask = () =>
      findKnowledge(
        `why do particle physicists histogram dijet mass qq${n++}zz`,
        [...KNOWLEDGE_BASE],
      );
    const t0 = performance.now();
    ask();
    const cold = performance.now() - t0;
    const warm = costInReferenceUnits(ask, 1).ms;
    expect(warm / Math.max(cold, 0.01) < 0.5).toBe(false);
  });

  it('repeated asking does not degrade (no per-call growth)', () => {
    const q = 'what is a jet';
    const first = costInReferenceUnits(
      () => findKnowledge(q),
      REPS.warmQuestion,
    );
    for (let i = 0; i < 2000; i++) findKnowledge(q);
    const later = costInReferenceUnits(
      () => findKnowledge(q),
      REPS.warmQuestion,
    );
    expect(degraded(first, later)).toEqual(
      expect.objectContaining({ degraded: false }),
    );
  });

  it('NEGATIVE CONTROL: the degradation check rejects a call that has grown 10x', () => {
    const first = costInReferenceUnits(
      () => findKnowledge('what is a jet'),
      REPS.warmQuestion,
    );
    const later = costInReferenceUnits(
      times(10, () => findKnowledge('what is a jet')),
      REPS.warmQuestion,
      3,
    );
    expect(degraded(first, later)).toEqual(
      expect.objectContaining({ degraded: true }),
    );
  });
});

/**
 * Whether a later measurement has grown by more than 5x.
 *
 * Compared in MILLISECONDS, not reference units: the two measurements are taken
 * back to back in the same process, so they share conditions directly, while
 * their two reference minima are sampled at different moments and dividing by
 * both adds noise instead of removing it (a deliberate tenfold regression
 * measured only 3.7x that way, and the control flaked).
 *
 * The 0.2 ms floor replaces a 1 microsecond epsilon that made the ratio of two
 * near-zero timings pure noise, so the FASTER the code became, the more likely
 * the test was to fail.
 */
function degraded(
  first: { ms: number },
  later: { ms: number },
): { degraded: boolean; growth: number } {
  const floor = 0.2;
  const growth = Math.max(later.ms, floor) / Math.max(first.ms, floor);
  return { degraded: growth > 5, growth: Number(growth.toFixed(2)) };
}

/** Look a question up against every entry separately: no index filtering. */
function scoreEveryEntry(q: string): void {
  for (const entry of KNOWLEDGE_BASE) findKnowledge(q, [entry]);
}

const CAP = 400;
const HUGE = 'what is a calorimeter and a jet and a muon '.repeat(1000);
const pathological = () => {
  findKnowledge(HUGE);
  keywordFallback(HUGE);
  suggestCommand(HUGE);
};

const UNSEEN = [
  'why do physicists care about missing transverse energy',
  'what happens inside the hadronic calorimeter during a shower',
  'tell me about bottom quark tagging in a busy event',
  'what does the muon spectrometer actually measure out there',
  'why is supersymmetry interesting for dark matter searches',
  'how does the injector chain feed protons into the ring',
  'what makes an isolated lepton different from one inside a jet',
  'why does the branching ratio matter when choosing a channel',
  'explain what a displaced secondary vertex indicates',
  'what does the quark gluon plasma tell us about the early universe',
];

/** Time each question once, bracketed by reference measurements. */
function coldCosts(
  questions: string[],
  ask: (q: string) => void,
): { floorRatio: number; worstRatio: number; refMs: number } {
  let refMs = Infinity;
  const measure = () => {
    const t0 = performance.now();
    referenceWork();
    refMs = Math.min(refMs, performance.now() - t0);
  };
  const costs: number[] = [];
  if (questions.length < 2)
    throw new Error('need two questions for secondWorst');
  for (const q of questions) {
    measure();
    const t0 = performance.now();
    ask(q);
    costs.push(performance.now() - t0);
  }
  measure();
  refMs = Math.max(refMs, 0.01);
  costs.sort((a, b) => a - b);
  return {
    floorRatio: Number((costs[0] / refMs).toFixed(2)),
    // Second-worst, not worst. A cold question cannot be re-timed, so one GC
    // or scheduler pause lands on a single sample (measured once at 331
    // reference units against a usual 17 to 31). An algorithmic blow-up slows
    // many questions, which the second-worst still sees.
    worstRatio: Number((costs[costs.length - 2] / refMs).toFixed(2)),
    refMs: Number(refMs.toFixed(3)),
  };
}
