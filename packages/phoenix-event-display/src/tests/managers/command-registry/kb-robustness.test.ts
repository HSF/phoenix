import {
  findKnowledge,
  isConceptQuestion,
  suggestKnowledge,
} from '../../../managers/command-registry/knowledge-base';

/**
 * TUNING SET for the tutor's retrieval (#942, Phase D). Students type with
 * typos, grammatical slips, and every phrasing under the sun, and there is no
 * guarantee they ask a topic the "right" way. This suite hits each topic with
 * (a) many phrasing templates and (b) common misspellings, and asserts
 * retrieval still resolves the intended entry.
 *
 * Read the numbers here as a TRAINING score, not an evaluation. The matcher and
 * the aliases were adjusted until this set passed, and the surface forms are
 * derived from the aliases themselves, so a high rate here says little about
 * questions nobody tuned for. The honest measurement is the HELD-OUT set at the
 * bottom of this file.
 */

import { CommandRegistry } from '../../../managers/command-registry/command-registry';
import { registerDefaultCommands } from '../../../managers/command-registry/default-commands';
import type { CommandHost } from '../../../managers/command-registry/command-host';
import {
  deriveCommandEntries,
  KNOWLEDGE_BASE,
  type KnowledgeEntry,
} from '../../../managers/command-registry/knowledge-base';

// Phrasing templates: {topic} is replaced with a surface form of the topic.
const QUESTION_TEMPLATES = [
  'what is {t}',
  'what is a {t}',
  'what is an {t}',
  'what is the {t}',
  'what is this {t}',
  "what's {t}",
  'whats {t}',
  'what are {t}',
  'what does {t} mean',
  'define {t}',
  'explain {t}',
  'explain the {t} to me',
  'tell me about {t}',
  'tell me about the {t}',
  'how does {t} work',
  'how do i use {t}',
  'how do i use the {t}',
  'i dont understand {t}',
  'can you explain {t}',
  '{t}?',
  'the {t}?',
  'whats this {t} and how do i use it',
];

// topic -> [expected entry id, [surface forms incl. typos]]
const TOPICS: { id: string; forms: string[] }[] = [
  { id: 'phoenix', forms: ['phoenix', 'phoinix', 'phenix', 'phonix'] },
  { id: 'track', forms: ['track', 'tracks', 'trak', 'traks', 'trck'] },
  { id: 'jet', forms: ['jet', 'jets'] },
  {
    id: 'calorimeter',
    forms: ['calorimeter', 'calorimter', 'calorimetre', 'calorimeer', 'calo'],
  },
  {
    id: 'calo-cell',
    forms: [
      'calo cell',
      'calo cells',
      'calocell',
      'calorimeter cell',
      'calo cel',
    ],
  },
  // 'vertix' replaces a duplicated 'vertex': the second entry was meant to be a
  // typo form and silently tested the correct spelling twice.
  { id: 'vertex', forms: ['vertex', 'vertices', 'vertx', 'vertix'] },
  {
    id: 'eta-phi',
    forms: ['eta phi', 'eta-phi', 'etaphi', 'eta phi panel', 'eta phi view'],
  },
  {
    id: 'kinematics',
    forms: [
      'kinematics',
      'kinematics panel',
      'kinematic',
      'kinematcs',
      'kinimatics',
    ],
  },
  { id: 'eta', forms: ['eta', 'pseudorapidity', 'pseudorapidty'] },
  { id: 'phi', forms: ['phi', 'azimuthal angle'] },
  { id: 'pt', forms: ['pt', 'transverse momentum', 'transverse momentom'] },
  {
    id: 'missing-energy',
    forms: ['missing energy', 'missing transverse energy', 'met', 'missing et'],
  },
  { id: 'muon', forms: ['muon', 'muons', 'muom', 'myuon'] },
  { id: 'electron', forms: ['electron', 'electrons', 'electrn'] },
  { id: 'photon', forms: ['photon', 'photons', 'foton'] },
  { id: 'clipping', forms: ['clipping', 'cliping', 'clippng', 'clip'] },
  {
    id: 'auto-rotate',
    forms: ['auto rotate', 'autorotate', 'auto-rotate', 'auto rotat'],
  },
  { id: 'dark-theme', forms: ['dark theme', 'dark mode', 'dark thme'] },
  { id: 'detector', forms: ['detector', 'detectors', 'detecter', 'detctor'] },
  { id: 'atlas', forms: ['atlas', 'altas', 'atals'] },
  { id: 'cms', forms: ['cms'] },
  { id: 'lhcb', forms: ['lhcb'] },
  { id: 'hsf', forms: ['hsf', 'hep software foundation'] },
  {
    id: 'invariant-mass',
    forms: ['invariant mass', 'invarient mass', 'invariant masss'],
  },
  { id: 'masterclass', forms: ['masterclass', 'master class', 'masterclas'] },
  {
    id: 'standard-model',
    forms: ['standard model', 'standrd model', 'standard modle'],
  },
  { id: 'boson', forms: ['boson', 'bosons', 'bosn'] },
  { id: 'lepton', forms: ['lepton', 'leptons', 'leptn'] },
  { id: 'quark', forms: ['quark', 'quarks', 'qurak'] },
  { id: 'neutrino', forms: ['neutrino', 'neutrinos', 'nutrino', 'netrino'] },
  {
    id: 'higgs-boson',
    forms: ['higgs', 'higgs boson', 'higs', 'higgs bosson'],
  },
  { id: 'z-boson', forms: ['z boson', 'z0'] },
  { id: 'w-boson', forms: ['w boson'] },
  { id: 'decay', forms: ['decay', 'decays', 'deacy'] },
  { id: 'resonance', forms: ['resonance', 'resonanse', 'mass peak'] },
  { id: 'trigger', forms: ['trigger', 'triger', 'trigerr'] },
  { id: 'luminosity', forms: ['luminosity', 'luminosty', 'lumi'] },
  { id: 'pileup', forms: ['pileup', 'pile up', 'pileip'] },
  {
    id: 'geometry-browser',
    forms: ['geometry browser', 'geometry browsr', 'browse geometry'],
  },
  {
    id: 'sessions',
    forms: ['sessions', 'session', 'phoenix sessions', 'recording'],
  },
  {
    id: 'event-browser',
    forms: ['event browser', 'event browsr', 'browse events'],
  },
  { id: 'reconstruction', forms: ['reconstruction', 'reconstuction', 'reco'] },
  { id: 'hadron', forms: ['hadron', 'hadrons', 'hadrn'] },
  { id: 'proton', forms: ['proton', 'protons', 'protn'] },
];

const fill = (tmpl: string, t: string) => tmpl.replace('{t}', t);

describe('tutor robustness (TUNING SET): phrasing x typos corpus', () => {
  // A representative slice of templates for the full topic x form x template
  // cross-product (keeping the suite fast but broad).
  const templates = QUESTION_TEMPLATES;

  it('resolves every topic across many phrasings and misspellings', () => {
    let total = 0;
    const misses: string[] = [];
    for (const { id, forms } of TOPICS) {
      for (const form of forms) {
        for (const tmpl of templates) {
          const q = fill(tmpl, form);
          total++;
          const got = findKnowledge(q)?.id ?? null;
          if (got !== id) misses.push(`"${q}" -> ${got} (want ${id})`);
        }
      }
    }
    // Report a sample of misses for debuggability; require a very high hit rate.
    const rate = (total - misses.length) / total;
    if (rate < 0.97) {
      console.log(
        `robustness ${(rate * 100).toFixed(1)}% (${misses.length}/${total} miss)`,
      );

      console.log(misses.slice(0, 40).join('\n'));
    }
    expect({ total, rate: rate >= 0.97 }).toEqual({ total, rate: true });
  });

  it('routes every phrasing template as a question', () => {
    const misses: string[] = [];
    for (const tmpl of templates) {
      const q = fill(tmpl, 'calorimeter');
      if (!isConceptQuestion(q)) misses.push(q);
    }
    expect(misses).toEqual([]);
  });

  it('bare topic forms are retrievable even without a question word', () => {
    // "eta phi panel", "calorimeter" typed alone should still resolve, so the
    // service can offer an answer when a bare term does not map to a command.
    const bare = [
      'eta phi panel',
      'calorimeter',
      'kinematics panel',
      'higgs boson',
      'the masterclass',
    ];
    for (const b of bare) expect(findKnowledge(b)).not.toBeNull();
  });

  it('does not hallucinate: unrelated queries still return null', () => {
    const unrelated = [
      'what is the meaning of life',
      'what is quantum entanglement',
      'what is photosynthesis',
      'how do i cook pasta',
      'what is the stock price',
      'who won the world cup',
    ];
    for (const u of unrelated) expect(findKnowledge(u)).toBeNull();
  });

  it('EFFECTIVE coverage: a student is either answered or offered the topic', () => {
    // Answering demands high confidence, so an aggressive typo becomes a
    // "did you mean ...?" instead. What matters to the student is that the
    // request is not a dead end, so measure answered OR suggested.
    let total = 0;
    let helped = 0;
    const stranded: string[] = [];
    for (const { id, forms } of TOPICS) {
      for (const form of forms) {
        for (const tmpl of QUESTION_TEMPLATES) {
          const q = fill(tmpl, form);
          total++;
          const answered = findKnowledge(q)?.id ?? null;
          const suggested = suggestKnowledge(q)?.id ?? null;
          if (answered === id || suggested === id) helped++;
          else if (stranded.length < 15)
            stranded.push(`"${q}" -> ${answered ?? suggested ?? 'null'}`);
        }
      }
    }
    const rate = helped / total;

    console.log(
      `effective coverage ${(rate * 100).toFixed(1)}% (${helped}/${total})`,
    );
    expect({ ok: rate >= 0.99, stranded: stranded.slice(0, 8) }).toEqual(
      expect.objectContaining({ ok: true }),
    );
  });
});

/**
 * HELD-OUT SET.
 *
 * Written from a student's side of the screen, in the language of a
 * masterclass worksheet and of guides/users.md ("how do I slice away part of
 * the geometry", "why do the tracks bend"), NOT derived from the aliases. The
 * acceptable entries for each question were decided before the set was first
 * run, and the questions were not edited after seeing the results. Where more
 * than one entry is a fair answer, all of them are listed.
 *
 * Measured against the SAME knowledge the shipping service answers from
 * (curated entries plus those derived from the registered commands), because
 * a derived entry can take a question away from a curated one.
 */
const HELD_OUT: [string, string[]][] = [
  ['how do i zoom in and out', ['zoom']],
  ['how do i see inside the detector', ['clipping']],
  ['how can i slice away part of the geometry', ['clipping']],
  ['what does the gear icon do', ['phoenix-menu', 'cuts']],
  ['how do i switch between orthographic and perspective', ['projection']],
  ['what are the preset views', ['preset-views']],
  ['how do i make the camera orbit the detector', ['auto-rotate']],
  ['how do i change to the light theme', ['dark-theme']],
  ['what is the overlay', ['overlay-view']],
  [
    'how do i select an object to see its information',
    ['object-selection', 'task-inspect-object'],
  ],
  ['what does the info panel show', ['info-panel']],
  ['how do i start the collision animation', ['animations']],
  ['what is performance mode', ['performance-mode']],
  ['can i use phoenix in virtual reality', ['vr-ar']],
  [
    'how do i hide all the overlays for a screenshot',
    ['screenshot-mode', 'screenshot'],
  ],
  ['how do i load my own event data file', ['import-export', 'data-formats']],
  ['how do i create a shareable link', ['share-link']],
  ['what are the keyboard shortcuts', ['keyboard-controls']],
  ['how do i save the state of the display', ['event-state']],
  ['how do i add a label to a track', ['labels']],
  ['what url parameters can i pass', ['url-options']],
  ['which file formats can phoenix load', ['data-formats', 'geometry-formats']],
  ['how do i apply cuts to a track collection', ['cuts', 'task-filter-tracks']],
  ['what does the collections info panel show', ['collections-info']],
  ['how do i browse example events', ['event-browser']],
  [
    'how do i tell an electron from a muon',
    ['electron', 'muon', 'task-find-particles'],
  ],
  ['what does a muon look like in the detector', ['muon']],
  ['why is the neutrino invisible', ['neutrino', 'missing-energy']],
  ['what is the missing et arrow', ['missing-energy']],
  [
    'how do i find the invariant mass of the two leptons',
    ['task-invariant-mass'],
  ],
  ['what is a dimuon event', ['dilepton']],
  ['why do the tracks bend', ['magnetic-field']],
  ['what is the difference between a track and a jet', ['track', 'jet']],
  ['what does a photon leave in the calorimeter', ['photon']],
  ['what is a z boson candidate', ['z-boson']],
  ['why is the w boson hard to measure', ['w-boson']],
  ['how many sigma do you need for a discovery', ['significance', 'discovery']],
  ['what is pileup and why does it matter', ['pileup']],
  ['what does gev mean', ['units']],
  ['is this a real collision', ['is-this-a-photo', 'open-data']],
  ['what is the transverse momentum of a track', ['pt']],
  ['how do i read the momentum of a track', ['task-inspect-object']],
  ['what can the higgs boson decay into', ['higgs-boson', 'decay']],
  ['what is a lepton pair with opposite charge', ['dilepton']],
  ['what colour is a muon track', ['colors', 'muon']],
  [
    'what are the calorimeter boxes',
    ['calo-cell', 'calorimeter', 'calo-cluster'],
  ],
  ['how big is the atlas detector', ['atlas']],
  [
    'how does the lhc accelerate protons',
    ['accelerator', 'injector-chain', 'lhc', 'dipole-magnets'],
  ],
  ['what energy do the protons collide at', ['lhc-energy']],
  ['what is an event number', ['run-event-number']],
  ['how many collisions happen per second', ['bunch']],
  ['what is a jet made of', ['jet']],
  ['why do we look at transverse momentum', ['pt']],
  ['what is the eta phi plot for', ['eta-phi']],
  ['what is the kinematics table', ['kinematics']],
  ['how do i tag a particle in the masterclass panel', ['masterclass']],
  ['where do i find the preset views', ['preset-views', 'view-options']],
  ['what is the phoenix menu for', ['phoenix-menu']],
  ['how do i hide a detector part', ['geometry-browser', 'phoenix-menu']],
  ['what do the different colours mean', ['colors']],
];

/**
 * The held-out questions the tutor gets wrong today (no answer, or the wrong
 * entry), as measured on first run: 45 of 60 correct, 75.0%. The gate asserts
 * EXACT equality so both directions are visible: a regression adds a line, a
 * fix removes one (update this list and the rate in the comment).
 */
const KNOWN_HELD_OUT_MISSES = [
  'what does the gear icon do -> null (want phoenix-menu|cuts)',
  'how do i hide all the overlays for a screenshot -> null (want screenshot-mode|screenshot)',
  'how do i add a label to a track -> null (want labels)',
  'how do i browse example events -> null (want event-browser)',
  'how do i tell an electron from a muon -> dilepton (want electron|muon|task-find-particles)',
  'what does a muon look like in the detector -> muon-spectrometer (want muon)',
  'what is the difference between a track and a jet -> null (want track|jet)',
  'what does a photon leave in the calorimeter -> null (want photon)',
  'how many sigma do you need for a discovery -> null (want significance|discovery)',
  'what is pileup and why does it matter -> null (want pileup)',
  'what colour is a muon track -> task-find-particles (want colors|muon)',
  'what are the calorimeter boxes -> null (want calo-cell|calorimeter|calo-cluster)',
  'what energy do the protons collide at -> proton (want lhc-energy)',
  'how many collisions happen per second -> is-this-a-photo (want bunch)',
  'what do the different colours mean -> null (want colors)',
];

/** Curated plus derived knowledge, composed as the shipping service does. */
function shippingKnowledge(): KnowledgeEntry[] {
  const registry = new CommandRegistry({
    eventDisplay: {},
    ui: {},
    three: {},
    state: {},
    emit: () => undefined,
    resolveObject: () => undefined,
    listGeometryParts: () => [],
  } as unknown as CommandHost);
  registerDefaultCommands(registry);
  return [...KNOWLEDGE_BASE, ...deriveCommandEntries(registry.list())];
}

/** Held-out questions a finder does not answer with an acceptable entry. */
function heldOutMisses(
  set: [string, string[]][],
  find: (q: string) => KnowledgeEntry | null,
): string[] {
  const misses: string[] = [];
  for (const [q, ok] of set) {
    const got = find(q)?.id ?? null;
    if (got === null || !ok.includes(got)) {
      misses.push(`${q} -> ${got} (want ${ok.join('|')})`);
    }
  }
  return misses;
}

describe('tutor robustness: HELD-OUT student questions', () => {
  it('misses exactly the known held-out questions (regression guard at the measured level)', () => {
    const kb = shippingKnowledge();
    const misses = heldOutMisses(HELD_OUT, (q) => findKnowledge(q, kb));
    const correct = HELD_OUT.length - misses.length;

    console.log(
      `held-out accuracy ${correct}/${HELD_OUT.length} = ${((100 * correct) / HELD_OUT.length).toFixed(1)}%`,
    );
    expect(misses).toEqual(KNOWN_HELD_OUT_MISSES);
  });

  it('NEGATIVE CONTROL: the held-out check reports a retrieval that stopped answering', () => {
    // Stands in for a regression that breaks retrieval for one question: a
    // finder that answers every question except one with the right entry.
    const broken = heldOutMisses(HELD_OUT.slice(0, 3), (q) =>
      q === 'how can i slice away part of the geometry'
        ? null
        : (KNOWLEDGE_BASE.find((e) => e.id === 'clipping') ?? null),
    );
    expect(broken).toEqual([
      'how do i zoom in and out -> clipping (want zoom)',
      'how can i slice away part of the geometry -> null (want clipping)',
    ]);
  });
});
