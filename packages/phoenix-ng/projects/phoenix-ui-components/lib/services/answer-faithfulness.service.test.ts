import {
  CommandRegistry,
  deriveCommandEntries,
  registerDefaultCommands,
  KNOWLEDGE_BASE,
  type KnowledgeEntry,
} from 'phoenix-event-display';
import {
  NaturalLanguageService,
  type NlOutcome,
} from './natural-language.service';

/**
 * FAITHFULNESS BY CONSTRUCTION, checked on the path that ships.
 *
 * The tutor's headline guarantee is that every answer a student sees is
 * byte-for-byte vetted text, never generated prose. The previous gate for this
 * iterated the raw knowledge-base array and checked each facet was a string,
 * which is a property of the DATA; it passed while selectFacet(), the function
 * that produces every emitted answer, was mutated to prepend invented physics.
 *
 * This gate drives NaturalLanguageService.ask() over a broad question corpus,
 * collects every answer it emits, and requires each body to be identical to a
 * vetted facet (body, howto, why or where) of an entry whose title it carries.
 * The oracle is built INDEPENDENTLY of the service (from the exported base and
 * derivation), then checked to agree with what the service answers from, so a
 * decorated answer cannot pass by also decorating the oracle.
 */

jest.setTimeout(180000);

const FACETS = ['body', 'howto', 'why', 'where'] as const;
type Facet = (typeof FACETS)[number];

/** A registry over a host whose every method is a harmless no-op. */
function makeRegistry(): CommandRegistry {
  const noop = () => undefined;
  const registry = new CommandRegistry({
    eventDisplay: {
      nextEvent: noop,
      previousEvent: noop,
      loadEvent: noop,
      zoomTo: noop,
      highlightObject: noop,
      lookAtObject: noop,
      getCollections: () => ({ Tracks: ['CombinedInDetTracks'] }),
      getCollection: () => [{ uuid: 'u1' }],
      getCurrentEventKey: () => 'run/1',
      getEventMetadata: () => [],
    },
    ui: {
      setDarkTheme: noop,
      displayView: noop,
      setAutoRotate: noop,
      setClipping: noop,
      setShowAxis: noop,
      geometryVisibility: noop,
      getPresetViews: () => [{ name: 'Left View' }],
    },
    three: { revertMainCamera: noop, isMainCameraOrthographic: () => false },
    state: {},
    emit: noop,
    resolveObject: () => ({ uuid: 'u1' }),
    listGeometryParts: () => ['Beam'],
  } as any);
  registerDefaultCommands(registry);
  return registry;
}

function eventDisplayFor(registry: CommandRegistry): any {
  return {
    getCommandRegistry: () => registry,
    getCollections: () => ({ Tracks: ['CombinedInDetTracks'] }),
    getUIManager: () => ({ getPresetViews: () => [{ name: 'Left View' }] }),
    getEventsData: () => ({ 'run/1': {} }),
    getGeometryPartNames: () => ['Beam'],
  };
}

/** Vetted text -> the facet kind and the titles of the entries that own it. */
interface Oracle {
  owners: Map<string, { facets: Set<Facet>; titles: Set<string> }>;
  titles: Set<string>;
}

function buildOracle(entries: KnowledgeEntry[]): Oracle {
  const owners: Oracle['owners'] = new Map();
  for (const entry of entries) {
    for (const facet of FACETS) {
      const text = entry[facet];
      if (typeof text !== 'string') continue;
      const own = owners.get(text) ?? { facets: new Set(), titles: new Set() };
      own.facets.add(facet);
      own.titles.add(entry.title);
      owners.set(text, own);
    }
  }
  return { owners, titles: new Set(entries.map((e) => e.title)) };
}

/** The problem with one emitted outcome, or null when it is faithful. */
function checkAnswer(q: string, out: NlOutcome, oracle: Oracle): string | null {
  if (!out.answer) return null;
  const { body, title, related } = out.answer;
  const own = oracle.owners.get(body);
  if (!own)
    return `"${q}": body is not vetted text: ${JSON.stringify(body.slice(0, 90))}`;
  if (!own.titles.has(title))
    return `"${q}": title "${title}" does not own that text`;
  const stray = related.filter((r) => !oracle.titles.has(r.title));
  if (stray.length)
    return `"${q}": related titles not vetted: ${stray.map((r) => r.title)}`;
  return null;
}

/** Questions a student could ask about every entry, in each facet's form. */
function questionCorpus(entries: KnowledgeEntry[]): string[] {
  const forms = [
    (t: string) => `what is ${t}`,
    (t: string) => `how do i use ${t}`,
    (t: string) => `why do we use ${t}`,
    (t: string) => `where is ${t}`,
    (t: string) => `tell me about ${t}?`,
    (t: string) => t,
  ];
  const qs = new Set<string>();
  for (const e of entries) {
    for (const alias of e.aliases.slice(0, 3)) {
      for (const form of forms) qs.add(form(alias));
    }
  }
  // Plus real phrasings from the service tests and the held-out set.
  for (const q of [
    'what is this eta phi panel and how cani use it ?',
    'how can i use the kinematics panel ?',
    'how do i filter tracks above 20 gev',
    'why do the tracks bend',
    'how do i find the invariant mass of the two leptons',
    'is this a real collision',
    'what does gev mean',
    'where do i find the preset views',
  ]) {
    qs.add(q);
  }
  return [...qs];
}

interface Report {
  asked: number;
  answered: number;
  problems: string[];
  byFacet: Record<Facet, number>;
  entriesAnswered: number;
}

async function faithfulnessReport(
  ask: (q: string) => Promise<NlOutcome>,
  corpus: string[],
  oracle: Oracle,
): Promise<Report> {
  const report: Report = {
    asked: 0,
    answered: 0,
    problems: [],
    byFacet: { body: 0, howto: 0, why: 0, where: 0 },
    entriesAnswered: 0,
  };
  const titles = new Set<string>();
  for (const q of corpus) {
    report.asked++;
    const out = await ask(q);
    if (!out.answer) continue;
    report.answered++;
    titles.add(out.answer.title);
    const problem = checkAnswer(q, out, oracle);
    if (problem) {
      report.problems.push(problem);
      continue;
    }
    for (const facet of oracle.owners.get(out.answer.body)!.facets) {
      report.byFacet[facet]++;
    }
  }
  report.entriesAnswered = titles.size;
  return report;
}

/**
 * Minimums that stop the gate passing vacuously (a path that answers nothing
 * emits nothing unvetted). Set well below what the corpus produces today; the
 * measured values are printed on every run.
 */
const MIN = { answered: 1500, entries: 140, perFacet: 40 };

function verdict(report: Report): string[] {
  const failures = [...report.problems.slice(0, 10)];
  if (report.problems.length > 10)
    failures.push(
      `... and ${report.problems.length - 10} more unvetted answers`,
    );
  if (report.answered < MIN.answered)
    failures.push(
      `only ${report.answered} answers emitted (need ${MIN.answered})`,
    );
  if (report.entriesAnswered < MIN.entries)
    failures.push(
      `only ${report.entriesAnswered} entries answered (need ${MIN.entries})`,
    );
  for (const facet of FACETS) {
    if (report.byFacet[facet] < MIN.perFacet)
      failures.push(
        `only ${report.byFacet[facet]} ${facet} answers (need ${MIN.perFacet})`,
      );
  }
  return failures;
}

function setup(Svc: typeof NaturalLanguageService = NaturalLanguageService) {
  const registry = makeRegistry();
  const svc = new Svc(eventDisplayFor(registry));
  // Independent oracle: what the vetted sources say, not what the service holds.
  const entries = [...KNOWLEDGE_BASE, ...deriveCommandEntries(registry.list())];
  return { registry, svc, entries, oracle: buildOracle(entries) };
}

describe('faithfulness: every answer ask() emits is vetted text', () => {
  it('the service answers from exactly the vetted sources the oracle is built from', () => {
    const { svc, entries } = setup();
    const facetTexts = (es: KnowledgeEntry[]) =>
      es
        .flatMap((e) => FACETS.map((f) => e[f]))
        .filter((t): t is string => typeof t === 'string')
        .sort();
    expect(facetTexts((svc as any).knowledge())).toEqual(facetTexts(entries));
  });

  it('GATE: byte-identical vetted text for every answer over the corpus', async () => {
    const { svc, entries, oracle } = setup();
    const corpus = questionCorpus(entries);
    const report = await faithfulnessReport((q) => svc.ask(q), corpus, oracle);
    console.log(
      `faithfulness: asked ${report.asked}, answered ${report.answered} from ${report.entriesAnswered} entries, by facet ${JSON.stringify(report.byFacet)}, unvetted ${report.problems.length}`,
    );
    expect(verdict(report)).toEqual([]);
  });

  it('NEGATIVE CONTROL: the checker rejects a fabricated answer', () => {
    // Stands in for any path that invents text: a plausible physics sentence
    // that appears in no entry must be rejected, and so must real text shown
    // under the wrong title.
    const { oracle } = setup();
    const fabricated: NlOutcome = {
      ok: true,
      answer: {
        title: 'Quark',
        body: 'I think a quark carries roughly 13 TeV of energy before it decays.',
        related: [],
      },
    };
    expect(checkAnswer('what is a quark', fabricated, oracle)).toMatch(
      /not vetted/,
    );
    const jet = KNOWLEDGE_BASE.find((e) => e.id === 'jet')!;
    const misTitled: NlOutcome = {
      ok: true,
      answer: { title: 'Quark', body: jet.body, related: [] },
    };
    expect(checkAnswer('what is a quark', misTitled, oracle)).toMatch(
      /does not own/,
    );
  });

  it('NEGATIVE CONTROL: the gate fails when selectFacet decorates the text (the auditor mutation)', async () => {
    // The exact mutation that the old gate passed: selectFacet() wrapping every
    // answer in invented physics. A private copy of the service module is
    // loaded against a copy of the core package whose selectFacet is
    // decorated, and driven through the same report and verdict.
    let Mutated!: typeof NaturalLanguageService;
    jest.isolateModules(() => {
      jest.doMock('phoenix-event-display', () => {
        const actual = jest.requireActual('phoenix-event-display');
        return {
          ...actual,
          selectFacet: (entry: any, intent: any) => {
            const facet = actual.selectFacet(entry, intent);
            return {
              ...facet,
              text: `I think this involves roughly 13 TeV of quark decays. ${facet.text}`,
            };
          },
        };
      });
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      Mutated = require('./natural-language.service').NaturalLanguageService;
    });
    const { entries, oracle } = setup();
    const svc = new Mutated(eventDisplayFor(makeRegistry()));
    const sample = questionCorpus(entries).filter((_, i) => i % 40 === 0);
    const report = await faithfulnessReport((q) => svc.ask(q), sample, oracle);
    expect(report.answered).toBeGreaterThan(0);
    expect(report.problems.length).toBe(report.answered);
    expect(verdict(report).length).toBeGreaterThan(0);
  });

  it('NEGATIVE CONTROL: the gate fails for a service whose answer path decorates the text', async () => {
    // Stands in for decoration added anywhere after retrieval (a "friendly"
    // preamble in tryAnswer, a summariser), not only inside selectFacet.
    class Decorating extends NaturalLanguageService {}
    const original = (NaturalLanguageService.prototype as any).tryAnswer;
    (Decorating.prototype as any).tryAnswer = function (text: string) {
      const out = original.call(this, text);
      if (out?.answer)
        out.answer.body = `${out.answer.body} (This is well established.)`;
      return out;
    };
    const { entries, oracle } = setup(Decorating);
    const svc = new Decorating(eventDisplayFor(makeRegistry()));
    const sample = questionCorpus(entries).filter((_, i) => i % 40 === 0);
    const report = await faithfulnessReport((q) => svc.ask(q), sample, oracle);
    expect(report.answered).toBeGreaterThan(0);
    expect(report.problems.length).toBe(report.answered);
  });

  it('NEGATIVE CONTROL: the gate fails for a path that stops answering (no vacuous pass)', async () => {
    // Stands in for a routing regression that sends every question elsewhere:
    // nothing unvetted is emitted, but the coverage minimums must still fail.
    const { entries, oracle } = setup();
    const silent = async (): Promise<NlOutcome> => ({ ok: false, none: true });
    const report = await faithfulnessReport(
      silent,
      questionCorpus(entries),
      oracle,
    );
    expect(report.problems).toEqual([]);
    expect(verdict(report)).toEqual(
      expect.arrayContaining([expect.stringMatching(/answers emitted/)]),
    );
  });
});
