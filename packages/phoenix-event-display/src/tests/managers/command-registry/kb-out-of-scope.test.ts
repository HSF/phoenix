import {
  contentTokens,
  detectQuestionIntent,
  findKnowledge,
  selectFacet,
  KNOWLEDGE_BASE,
  type KnowledgeEntry,
} from '../../../managers/command-registry/knowledge-base';

/**
 * OUT-OF-SCOPE corpus: the safety half of the evaluation.
 *
 * The positive corpus (kb-robustness.test.ts) proves the tutor FINDS the right
 * answer. This one proves it does NOT invent one. A tutor used by students is
 * far more damaged by one confidently wrong answer than by ten honest "I don't
 * know"s, so the metric that matters is the FALSE-ANSWER RATE: of the questions
 * the tutor has no vetted answer for, how many does it answer anyway?
 *
 * Rates are reported PER GROUP. Most of the original probes share no content
 * word with any alias, so they can never reach an entry however the matcher is
 * tuned; pooled with them, a regression in the hard tail would disappear into
 * a comfortable average. The adversarial groups reuse in-domain vocabulary on
 * purpose, and are gated separately.
 *
 * The byte-for-byte faithfulness guarantee (every emitted answer is vetted
 * text) is NOT tested here: it is a property of the shipping answer path, so it
 * is gated where that path lives, in phoenix-ng's
 * answer-faithfulness.service.test.ts.
 */

/** Physics that is real but deliberately NOT in this knowledge base. */
const OTHER_PHYSICS = [
  'what is quantum entanglement',
  'what is the uncertainty principle',
  'what is general relativity',
  'what is string theory',
  'what is a neutron star',
  'what is nuclear fusion',
  'what is radioactivity',
  'what is a semiconductor',
  'what is superconductivity in power lines',
  'what is the photoelectric effect',
  'what is quantum chromodynamics',
  'what is the cosmic microwave background',
  'what is a wormhole',
  'what is thermodynamics',
  'what is entropy',
  'what is a laser',
  'what is plasma physics',
  'what is a magnetic monopole',
  'what is the double slit experiment',
  // Exotic names that share no vocabulary the matcher can reach (checked by
  // the reachability gate below), so they belong with the easy probes.
  'what is a tetraquark',
  'what is a pentaquark',
  'what is a glueball',
  'what is a leptoquark',
  'what is lattice qcd',
  'what is a gravitino',
  'what is a chargino',
  'what is a bino',
  'what is hadronisation',
];

/**
 * Phoenix-adjacent features that genuinely do not exist here. Answering these
 * with the vetted "what Phoenix cannot do" entry is CORRECT (it tells the
 * student the truth); answering them with an unrelated topic is not. They are
 * therefore checked separately from the pure out-of-scope set below.
 */
const ABSENT_FEATURES = [
  'how do i simulate a collision',
  'how do i generate new events',
  'how do i change the magnetic field strength',
  'how do i edit the detector geometry',
  'how do i export to excel',
  'how do i fit a curve to the data',
];

/**
 * In-domain vocabulary used for a task Phoenix does not perform. Surfacing the
 * adjacent TOPIC entry here is acceptable and useful (it explains what a
 * calorimeter is) as long as no procedure is offered for the unsupported task.
 */
const ADJACENT_TOPIC_OK = [
  'how do i calibrate the calorimeter',
  'how do i print the event',
  // Phoenix does not cluster jets, and it does not let you plot an arbitrary
  // quantity: the histogram panel fills itself from masterclass results and is
  // not a general plotting tool. Surfacing the CONCEPT is honest and useful;
  // what would be wrong is offering Phoenix steps for either.
  'how is the jet clustering algorithm implemented',
  'how do i plot a histogram',
];

/**
 * Topics that ARE inside the LHC ecosystem even though they are not about
 * Phoenix's UI. A masterclass student asking these deserves a real answer:
 * supersymmetry is what ATLAS and CMS actively search for, so treating it as
 * out of scope was a misclassification.
 */
const IN_SCOPE_PHYSICS = [
  'what is supersymmetry',
  'what is cp violation',
  'what is quark gluon plasma',
  'what is b tagging',
  'what is a top quark',
  'what is the high luminosity lhc',
];

/** Absent features with NO vetted answer at all: these must return null. */
const ABSENT_NO_ANSWER = [
  'how do i run a machine learning model',
  'how do i write a plugin',
  'how do i undo my last action',
];

/** Near-miss vocabulary: uses in-domain words for out-of-domain requests. */
const NEAR_MISS = [
  'how do i simulate calorimeter showers',
  'what is the track reconstruction algorithm code',
  'what is the trigger menu configuration',
  'what is the detector alignment procedure',
  'how do i tune the reconstruction software',
  'what is the muon reconstruction efficiency',
];

/** General knowledge with no connection to the domain. */
const GENERAL = [
  'what is the meaning of life',
  'how do i cook pasta',
  'what is the stock price',
  'who won the world cup',
  'what is photosynthesis',
  'what is the capital of france',
  'how do i learn python',
  'what is machine learning',
  'tell me a joke',
  'what is the weather today',
  'how old is the earth',
  'who is albert einstein',
  'what is a database',
  'how do i fix my wifi',
  'what time is it',
  'what is javascript',
  'how do i bake a cake',
  'what is a black cat',
  'who wrote hamlet',
  'what is the speed limit',
];

/**
 * ADVERSARIAL: real high-energy-physics topics this knowledge base has no
 * entry for, phrased with the words its entries DO use (quark, boson, beam,
 * track, trigger, calorimeter). The adjacent entry is not an answer to these:
 * "what is the lhc beam dump" answered with the dipole magnets is wrong.
 */
const ADV_PHYSICS = [
  'what is neutrino oscillation',
  'what is the muon g minus 2 anomaly',
  'what is a sterile neutrino',
  'what is a graviton',
  'what is quark confinement',
  'what is the weak mixing angle',
  'what is the proton radius puzzle',
  'what is proton decay',
  'what is a muon collider',
  'what is jet quenching',
  'what is electron capture',
  'what is the top quark yukawa coupling',
  'what is the higgs self coupling',
  'what is the lhc beam dump',
  'how does the lhc cryogenic helium system work',
  'what is the atlas toroid magnet current',
  'what is the lhcb vertex locator',
  'what is the trigger dead time',
  'what is luminosity levelling',
  'what is the jet energy scale calibration',
  'what is the muon momentum resolution',
  'what is a kalman filter track fit',
  'what is the electron identification likelihood',
  'what is a boosted top quark jet substructure',
  'what is the photon conversion rate in the tracker',
  'what is the calorimeter sampling fraction',
  'what is the w boson mass anomaly',
  'what is double higgs production',
  'what is a heavy neutral lepton',
  'what is the b meson anomaly',
  'what is the charm quark mass',
  'what is the parton distribution function',
  'what is the underlying event',
  'what is an effective field theory',
];

/**
 * ADVERSARIAL: hypothetical and exotic particle names one or two letters from
 * a real one. A single-word near miss is exactly what the single-word bar
 * exists to refuse: a squark is not a quark, and positronium is not a positron.
 */
const ADV_NEAR_NAMES = [
  'what is a squark',
  'what is a selectron',
  'what is a neutralino',
  'what is a gluino',
  'what is a photino',
  'what is a higgsino',
  'what is muonium',
  'what is positronium',
  'what is a sneutrino',
  'what is a smuon',
  'what is a stau',
  'what is a wino',
  'what is protonium',
];

/**
 * ADVERSARIAL: Phoenix-adjacent features that do not exist, phrased with the
 * names of features that do. Answering one with the neighbouring feature's
 * steps hands the student a procedure for a different task.
 */
const ADV_FEATURES = [
  'how do i measure the distance between two hits',
  'how do i fit a helix to the hits',
  'how do i export the event to a root file',
  'how do i run the reconstruction in the browser',
  'how do i train a neural network on the events',
  'how do i add a new detector to the geometry browser',
  'how do i upload my event to cern',
  'how do i play a sound when a muon appears',
  'how do i chat with other students in the masterclass',
  'how do i compare two events side by side',
  'how do i overlay two events',
  'how do i change the camera field of view angle',
  'how do i delete a track from the event',
  'how do i edit the momentum of a track',
  'how do i show the magnetic field map',
  'how do i draw the feynman diagram for this event',
  'how do i calculate the cross section from the event',
  'how do i plot the eta distribution of all tracks',
  'how do i export the kinematics table to csv',
  'how do i turn on the trigger simulation',
  'how do i change the beam energy',
  'how do i see the pileup vertices in a different colour per vertex',
  'how do i make the calorimeter transparent to neutrinos',
  'how do i record the detector in 4k',
];

/**
 * Every adversarial probe the tutor currently ANSWERS, with the entry it
 * answers from (all wrappers combined). Each of these is a false answer a
 * student could see today. The gate asserts EXACT equality: a fix makes this
 * list shrink (update it), a regression makes it grow (investigate).
 *
 * Each was read against the entry's own vetted text before being listed, to
 * confirm the text does not in fact answer the question:
 * the "forces" entry never mentions a graviton; "dipole-magnets" says nothing
 * of a beam dump; "task-filter-tracks" is about cuts, not a Kalman filter;
 * "quark", "electron", "neutrino", "muon", "positron", "proton" and
 * "higgs-boson" define the particle, not its supersymmetric partner or bound
 * state; "geometry-browser", "masterclass", "task-inspect-object", "eta-phi"
 * and "kinematics" return steps for a DIFFERENT task (browsing, tagging,
 * reading numbers, plotting points, reading a table); "root", "feynman-diagram",
 * "cross-section", "magnetic-field", "lhc-energy", "top-quark" and "w-boson"
 * are definitions offered for a request they do not address.
 */
const KNOWN_FALSE_ANSWERS = [
  'what is a graviton -> forces',
  'what is the top quark yukawa coupling -> top-quark',
  'what is the lhc beam dump -> dipole-magnets',
  'what is a kalman filter track fit -> task-filter-tracks',
  'what is the w boson mass anomaly -> w-boson',
  'what is a squark -> quark',
  'what is a selectron -> electron',
  'what is a neutralino -> neutrino',
  'what is a higgsino -> higgs-boson',
  'what is muonium -> muon',
  'what is positronium -> positron',
  'what is a sneutrino -> neutrino',
  'what is a smuon -> muon',
  'what is protonium -> proton',
  'how do i export the event to a root file -> root',
  'how do i add a new detector to the geometry browser -> geometry-browser',
  'how do i chat with other students in the masterclass -> masterclass',
  'how do i compare two events side by side -> clipping',
  'how do i edit the momentum of a track -> task-inspect-object',
  'how do i show the magnetic field map -> magnetic-field',
  'how do i draw the feynman diagram for this event -> feynman-diagram',
  'how do i calculate the cross section from the event -> cross-section',
  'how do i plot the eta distribution of all tracks -> eta-phi',
  'how do i export the kinematics table to csv -> kinematics',
  'how do i change the beam energy -> lhc-energy',
];

const EASY_GROUPS: Record<string, string[]> = {
  OTHER_PHYSICS,
  ABSENT_NO_ANSWER,
  NEAR_MISS,
  GENERAL,
};
const ADVERSARIAL_GROUPS: Record<string, string[]> = {
  ADV_PHYSICS,
  ADV_NEAR_NAMES,
  ADV_FEATURES,
};

const ALL_OOS = [
  ...OTHER_PHYSICS,
  ...ABSENT_NO_ANSWER,
  ...NEAR_MISS,
  ...GENERAL,
];

/** Wrappers a student might put around any of the above. */
const WRAPPERS = [
  (q: string) => q,
  (q: string) => `${q}?`,
  (q: string) => `please ${q}`,
  (q: string) => `can you tell me ${q}`,
  (q: string) => `i want to know ${q}`,
];

type Finder = (q: string) => KnowledgeEntry | null;

/**
 * The false answers a finder gives over a set of base probes, one line per
 * probe that any wrapper got answered, naming every entry it was answered
 * from. Also the wrapped rate, which is what a student population would see.
 */
function falseAnswers(
  bases: string[],
  find: Finder,
): { lines: string[]; answered: number; total: number } {
  const lines: string[] = [];
  let answered = 0;
  let total = 0;
  for (const base of bases) {
    const ids = new Set<string>();
    for (const wrap of WRAPPERS) {
      total++;
      const hit = find(wrap(base));
      if (hit) {
        answered++;
        ids.add(hit.id);
      }
    }
    if (ids.size) lines.push(`${base} -> ${[...ids].sort().join('|')}`);
  }
  return { lines, answered, total };
}

const strict: Finder = (q) => findKnowledge(q);
const rate = (r: { answered: number; total: number }) => r.answered / r.total;

describe('out-of-scope: the tutor must decline, not invent', () => {
  it('answers NONE of the easy out-of-scope questions, checked per group', () => {
    const report: Record<string, string> = {};
    const leaks: string[] = [];
    for (const [group, bases] of Object.entries(EASY_GROUPS)) {
      const r = falseAnswers(bases, strict);
      report[group] =
        `${(rate(r) * 100).toFixed(1)}% of ${r.total} (${bases.length} probes x ${WRAPPERS.length} wrappers)`;
      leaks.push(...r.lines.map((l) => `${group}: ${l}`));
    }

    console.log(
      `easy out-of-scope false-answer rates ${JSON.stringify(report)}`,
    );
    expect(leaks).toEqual([]);
  });

  it('ADVERSARIAL: the current false answers are exactly the known list', () => {
    const report: Record<string, string> = {};
    const lines: string[] = [];
    for (const [group, bases] of Object.entries(ADVERSARIAL_GROUPS)) {
      const r = falseAnswers(bases, strict);
      report[group] =
        `${(rate(r) * 100).toFixed(1)}% of ${r.total} (${bases.length} probes x ${WRAPPERS.length} wrappers)`;
      lines.push(...r.lines);
    }

    console.log(`adversarial false-answer rates ${JSON.stringify(report)}`);
    // Sorted on both sides so the diff a failure prints is readable.
    expect([...lines].sort()).toEqual([...KNOWN_FALSE_ANSWERS].sort());
  });

  it('every adversarial probe really is adversarial (shares vocabulary with an alias)', () => {
    // A probe with no word near any alias can never reach an entry, so it
    // measures nothing. That is how most of the original corpus ended up
    // trivially easy; this keeps the adversarial groups honest.
    const unreachable = Object.values(ADVERSARIAL_GROUPS)
      .flat()
      .filter((q) => !sharesAliasVocabulary(q));
    expect(unreachable).toEqual([]);
  });

  it('NEGATIVE CONTROL: the vocabulary check rejects an easy probe', () => {
    // Stands in for padding the adversarial group with a probe that could
    // never be answered, which would dilute its false-answer rate.
    expect(sharesAliasVocabulary('who wrote hamlet')).toBe(false);
    expect(sharesAliasVocabulary('what is a tetraquark')).toBe(false);
    expect(sharesAliasVocabulary('what is a squark')).toBe(true);
  });

  it('NEGATIVE CONTROL: the per-group gate reports an answered probe', () => {
    // Stands in for a matcher regression that starts answering general
    // knowledge: a finder that answers everything must produce leak lines.
    const leaky: Finder = () => KNOWLEDGE_BASE[0];
    expect(falseAnswers(GENERAL, leaky).lines).toHaveLength(GENERAL.length);
    expect(falseAnswers(GENERAL, strict).lines).toEqual([]);
  });

  it('never offers a procedure for an adjacent, unsupported task', () => {
    // Every query is accounted for: it is declined, or answered WITHOUT steps.
    // The old version skipped a declined query with `continue` and then
    // asserted that a body exists, which is true of every entry, so it could
    // not fail.
    const report = procedureReport(ADJACENT_TOPIC_OK, strict);

    console.log(
      `adjacent tasks: ${report.declined.length} declined, ${report.withoutProcedure.length} answered without steps, ${report.procedureOffered.length} offered steps`,
    );
    expect(report.procedureOffered).toEqual([]);
    expect(report.declined.length + report.withoutProcedure.length).toBe(
      ADJACENT_TOPIC_OK.length,
    );
  });

  it('NEGATIVE CONTROL: the procedure check fires when an entry gains invented steps', () => {
    // Stands in for someone adding a howto to the jet-algorithm entry (steps
    // for clustering jets, which Phoenix does not do). A tampered copy of the
    // base goes through the same check and must be caught.
    const tampered = KNOWLEDGE_BASE.map((e) =>
      e.id === 'jet-algorithm'
        ? { ...e, howto: 'Open the jets menu and press Recluster.' }
        : e,
    );
    const report = procedureReport(ADJACENT_TOPIC_OK, (q) =>
      findKnowledge(q, tampered),
    );
    expect(report.procedureOffered).toEqual([
      'how is the jet clustering algorithm implemented -> jet-algorithm',
    ]);
  });

  it('tells the student the truth about things Phoenix cannot do', () => {
    // These have a vetted answer ("Phoenix is a viewer, not a physics
    // program"), which is the correct response: an honest limit, not silence
    // and not an invented procedure.
    for (const q of ABSENT_FEATURES) {
      const hit = findKnowledge(q);
      expect({ q, id: hit?.id ?? null }).toEqual({ q, id: 'limits' });
    }
  });

  it('answers the physics that IS inside the LHC ecosystem', () => {
    // The counterweight to the out-of-scope corpus: declining is only correct
    // when the topic really is outside the ecosystem. These must be answered,
    // with vetted text, or the tutor is uselessly narrow for a student.
    for (const q of IN_SCOPE_PHYSICS) {
      const hit = findKnowledge(q);
      expect({ q, answered: hit !== null }).toEqual({ q, answered: true });
      expect(hit!.body.length).toBeGreaterThan(40);
    }
  });

  it('never claims Phoenix performs analysis it does not perform', () => {
    // Physics accuracy: a concept entry may explain jet clustering, but it must
    // not leave a student thinking Phoenix does it. `histogram` used to be in
    // this list; it was removed when the histogram panel landed upstream,
    // because Phoenix genuinely does draw one now and the old assertion was
    // asserting a world that no longer exists.
    for (const id of ['jet-algorithm']) {
      const entry = KNOWLEDGE_BASE.find((e) => e.id === id);
      expect(entry).toBeDefined();
      const text = [entry!.body, entry!.howto, entry!.why, entry!.where]
        .filter(Boolean)
        .join(' ');
      expect(text.toLowerCase()).toMatch(
        /phoenix (itself )?does not|phoenix shows|already built/,
      );
      // And it can never hand out steps for something Phoenix cannot do.
      expect(entry!.howto).toBeUndefined();
    }
  });

  it('describes the histogram panel now that it exists, but not other programs', () => {
    // This assertion used to require the OPPOSITE: the histogram panel did not
    // exist, so the tutor had to decline. It does exist now, so the useful
    // property is the boundary, that a real Phoenix panel is explained while a
    // question about some other program still gets nothing.
    expect(findKnowledge('how do i use the histogram panel')?.id).toBe(
      'histogram',
    );
    expect(findKnowledge('how do i plot a histogram in excel')).toBeNull();
    expect(findKnowledge('how do i plot a histogram in root')).toBeNull();
  });

  it('vetted text carries no template placeholders or drafting artefacts', () => {
    // A property of the DATA only. It says nothing about what the answer path
    // emits; that is gated in answer-faithfulness.service.test.ts.
    const artefacts: string[] = [];
    for (const entry of KNOWLEDGE_BASE) {
      for (const [facet, text] of Object.entries({
        body: entry.body,
        howto: entry.howto,
        why: entry.why,
        where: entry.where,
      })) {
        if (text === undefined) continue;
        if (
          text.trim().length <= 20 ||
          /\{\{|\}\}|TODO|TBD|lorem ipsum/i.test(text)
        ) {
          artefacts.push(`${entry.id}.${facet}`);
        }
      }
    }
    expect(artefacts).toEqual([]);
  });
});

/**
 * SAFETY-KNOB SENSITIVITY.
 *
 * Each knob is justified in the source by this corpus ("at this bar the
 * false-answer rate is zero"). That justification only means something if the
 * corpus can SEE the knob: loosening it must raise the measured false-answer
 * rate. A knob the corpus is blind to can be loosened without any test
 * noticing.
 */
describe('out-of-scope: the corpus can see each safety knob', () => {
  const NEGATIVE = [...ALL_OOS, ...Object.values(ADVERSARIAL_GROUPS).flat()];

  /** Wrapped false-answer rate of a finder over the whole negative corpus. */
  const corpusRate = (find: Finder) => rate(falseAnswers(NEGATIVE, find));

  it('loosening the single-word bar (0.82 -> 0.6) raises the false-answer rate', () => {
    const base = corpusRate((q) => findKnowledge(q));
    const loose = corpusRate((q) => findKnowledge(q, KNOWLEDGE_BASE, 0.6));
    expect({ raised: loose > base, base, loose }).toEqual(
      expect.objectContaining({ raised: true }),
    );
  });

  it('FINDING: loosening MATCH_THRESHOLD (2.4 -> 0.35) is INVISIBLE to this corpus', () => {
    // Measured, not assumed: with every human-written probe here, including
    // the 71 adversarial ones written to reuse in-domain vocabulary, the rate
    // is identical at 2.4 and at 0.35. A search of 179,088 generated probes
    // found only 15 where the threshold binds, all of them near-words
    // ("iconic" for the iconbar), and a pass over 2,621 dictionary words found
    // one. The coverage gate and the scoring floors already remove almost
    // everything the threshold would, so the threshold is close to redundant.
    // This test pins that finding: it goes red the day the threshold starts
    // doing independent work, which is when this note must be revisited.
    const base = corpusRate((q) => findKnowledge(q));
    const loose = corpusRate((q) =>
      findKnowledge(q, KNOWLEDGE_BASE, undefined, 0.35),
    );
    expect(loose).toBe(base);
  });

  it('NEGATIVE CONTROL: the sensitivity measurement does detect the threshold where it binds', () => {
    // Without this, "no change" could mean the measurement is broken rather
    // than the knob being redundant. These probes came out of the generated
    // search above: at 0.35 they are answered, at 2.4 they are not, and the
    // same rate function must report the difference.
    const probes = ['what is iconic', 'tell me about iconic'];
    const base = rate(falseAnswers(probes, (q) => findKnowledge(q)));
    const loose = rate(
      falseAnswers(probes, (q) =>
        findKnowledge(q, KNOWLEDGE_BASE, undefined, 0.35),
      ),
    );
    expect({ base, raised: loose > base }).toEqual({ base: 0, raised: true });
  });
});

/**
 * Whether a probe shares a content word with some alias closely enough for the
 * matcher to consider that entry at all.
 */
function sharesAliasVocabulary(q: string): boolean {
  const aliasTokens = [
    ...new Set(
      KNOWLEDGE_BASE.flatMap((e) => e.aliases.flatMap((a) => contentTokens(a))),
    ),
  ];
  return contentTokens(q).some((t) => aliasTokens.some((a) => reaches(t, a)));
}

/**
 * Whether a query word can reach an alias word at the matcher's own bar
 * (a token score of at least 0.7): an exact match, a close prefix, or a small
 * edit distance on words of four letters or more, scored the way the matcher
 * scores it. The trigram fallback is left out, so this can only under-count.
 */
function reaches(t: string, a: string): boolean {
  if (t === a) return true;
  const minLen = Math.min(t.length, a.length);
  const len = Math.max(t.length, a.length);
  if (minLen >= 3 && (t.startsWith(a) || a.startsWith(t)) && len - minLen <= 4)
    return true;
  if (minLen < 4) return false;
  const maxEdits = len <= 5 ? 1 : len <= 9 ? 2 : 3;
  const d = levenshtein(t, a);
  return d <= maxEdits && 1 - (d - 0.5) / (len + 1) >= 0.7;
}

function levenshtein(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        prev + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      prev = tmp;
    }
  }
  return row[b.length];
}

/**
 * For each how-to query: declined, answered with no steps, or answered WITH
 * steps (a procedure offered for a task Phoenix does not perform).
 */
function procedureReport(
  queries: string[],
  find: Finder,
): {
  declined: string[];
  withoutProcedure: string[];
  procedureOffered: string[];
} {
  const declined: string[] = [];
  const withoutProcedure: string[] = [];
  const procedureOffered: string[] = [];
  for (const q of queries) {
    const hit = find(q);
    if (!hit) {
      declined.push(q);
      continue;
    }
    // What the tutor would actually show for this kind of question.
    const facet = selectFacet(hit, detectQuestionIntent(q));
    const offersSteps =
      hit.howto !== undefined &&
      (facet.text === hit.howto || detectQuestionIntent(q) === 'howto');
    if (offersSteps) procedureOffered.push(`${q} -> ${hit.id}`);
    else withoutProcedure.push(`${q} -> ${hit.id}`);
  }
  return { declined, withoutProcedure, procedureOffered };
}
