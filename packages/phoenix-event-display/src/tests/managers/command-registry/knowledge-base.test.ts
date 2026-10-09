import { CommandRegistry } from '../../../managers/command-registry/command-registry';
import { registerDefaultCommands } from '../../../managers/command-registry/default-commands';
import type { CommandHost } from '../../../managers/command-registry/command-host';
import { validateIntent } from '../../../managers/command-registry/nl-intent';
import {
  KNOWLEDGE_BASE,
  contentTokens,
  findKnowledge,
  isConceptQuestion,
  getKnowledgeEntry,
} from '../../../managers/command-registry/knowledge-base';

function reg(): CommandRegistry {
  const r = new CommandRegistry({
    eventDisplay: {},
    ui: {},
    three: {},
    state: {},
    emit: () => undefined,
    resolveObject: () => undefined,
    listGeometryParts: () => [],
  } as unknown as CommandHost);
  registerDefaultCommands(r);
  return r;
}

describe('knowledge-base: integrity', () => {
  it('has unique entry ids', () => {
    const ids = KNOWLEDGE_BASE.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every entry has a title, aliases and a non-trivial body', () => {
    for (const e of KNOWLEDGE_BASE) {
      expect(e.title.length).toBeGreaterThan(0);
      expect(e.aliases.length).toBeGreaterThan(0);
      expect(e.body.length).toBeGreaterThan(40);
    }
  });

  it('no two entries claim the same exact single-word alias (ambiguity guard)', () => {
    // A single meaningful word must identify ONE topic. This catches aliases
    // that collapse to the same token after stopword removal (for example
    // "is the lhc on" reduces to "lhc" and would collide with the LHC entry).
    //
    // It uses the MATCHER'S OWN tokenizer rather than a copy: a private copy
    // silently guards a different function. That is not hypothetical, the copy
    // here dropped the single letters that name particles, so it reported "b
    // quark" and "k meson" as colliding with "quark" and "meson" when the
    // matcher keeps them distinct.
    const contentWords = contentTokens;
    const owner: Record<string, string> = {};
    const clashes: string[] = [];
    for (const entry of KNOWLEDGE_BASE) {
      for (const alias of entry.aliases) {
        const words = contentWords(alias);
        if (words.length !== 1) continue;
        const key = words[0];
        if (owner[key] && owner[key] !== entry.id) {
          clashes.push(`"${key}": ${owner[key]} vs ${entry.id}`);
        } else {
          owner[key] = entry.id;
        }
      }
    }
    expect(clashes).toEqual([]);
  });

  it('every related id points to a real entry', () => {
    for (const e of KNOWLEDGE_BASE) {
      for (const rel of e.related ?? []) {
        expect(getKnowledgeEntry(rel)).toBeDefined();
      }
    }
  });

  it('every suggested action is a REGISTERED command with valid args (safety)', () => {
    const r = reg();
    for (const e of KNOWLEDGE_BASE) {
      if (!e.action) continue;
      const res = validateIntent(
        { command: e.action.command, args: e.action.args ?? {} },
        r,
      );
      expect({ id: e.id, ok: res.ok }).toEqual({ id: e.id, ok: true });
    }
  });
});

describe('knowledge-base: isConceptQuestion routing', () => {
  const questions = [
    'what is eta-phi?',
    'what are tracks',
    'what is a jet',
    'explain the calorimeter',
    'define pseudorapidity',
    'tell me about atlas',
    'what does pt mean',
    'what is the kinematics panel',
  ];
  for (const q of questions) {
    it(`treats "${q}" as a concept question`, () =>
      expect(isConceptQuestion(q)).toBe(true));
  }

  const actions = [
    'hide the calorimeter',
    'next event',
    'spin the detector',
    'switch to dark theme',
    'describe this event', // live data -> command, not glossary
    'what is this event', // live data -> command
    'zoom in',
    '',
  ];
  for (const a of actions) {
    it(`does NOT treat "${a}" as a concept question`, () =>
      expect(isConceptQuestion(a)).toBe(false));
  }
});

describe('knowledge-base: findKnowledge retrieval', () => {
  const cases: [string, string][] = [
    ['what is phoenix', 'phoenix'],
    ['what is an event display', 'event-display'],
    ['what are tracks', 'track'],
    ['what is a jet', 'jet'],
    ['what is the calorimeter', 'calorimeter'],
    ['what are calo cells', 'calo-cell'],
    ['what is a vertex', 'vertex'],
    ['what is eta-phi', 'eta-phi'],
    ['what is the kinematics panel', 'kinematics'],
    ['what is eta', 'eta'],
    ['what is phi', 'phi'],
    ['what is transverse momentum', 'pt'],
    ['what is pt', 'pt'],
    ['what is missing energy', 'missing-energy'],
    ['what is a muon', 'muon'],
    ['what is clipping', 'clipping'],
    ['what is dark mode', 'dark-theme'],
    ['what are the keyboard shortcuts', 'keyboard-controls'],
    ['what is atlas', 'atlas'],
    ['what is lhcb', 'lhcb'],
    ['what is the hep software foundation', 'hsf'],
    ['what data formats does it support', 'data-formats'],
    ['what is physlite', 'physlite'],
    ['what is the masterclass', 'masterclass'],
    ['what is invariant mass', 'invariant-mass'],
    ['what is a photon', 'photon'],
  ];
  for (const [q, id] of cases) {
    it(`"${q}" -> ${id}`, () => {
      expect(findKnowledge(q)?.id).toBe(id);
    });
  }

  const masterclassCases: [string, string][] = [
    ['what is the standard model', 'standard-model'],
    ['what is a boson', 'boson'],
    ['what is a lepton', 'lepton'],
    ['what is a quark', 'quark'],
    ['what is a neutrino', 'neutrino'],
    ['what is the z boson', 'z-boson'],
    ['what is the w boson', 'w-boson'],
    ['what is the higgs boson', 'higgs-boson'],
    ['what is a decay', 'decay'],
    ['what is signal and background', 'signal-background'],
    ['what is a resonance', 'resonance'],
    ['what is a dimuon event', 'dilepton'],
    ['what is a trigger', 'trigger'],
    ['what is luminosity', 'luminosity'],
    ['what is pileup', 'pileup'],
    ['what is antimatter', 'antimatter'],
    ['what is the geometry browser', 'geometry-browser'],
    ['what are phoenix sessions', 'sessions'],
    ['what is reconstruction', 'reconstruction'],
    ['what is a hadron', 'hadron'],
  ];
  for (const [q, id] of masterclassCases) {
    it(`masterclass: "${q}" -> ${id}`, () => {
      expect(findKnowledge(q)?.id).toBe(id);
    });
  }

  it('returns null when nothing matches well (honest "I do not know")', () => {
    expect(findKnowledge('what is the meaning of life')).toBeNull();
    expect(findKnowledge('what is quantum chromodynamics')).toBeNull();
    expect(findKnowledge('order me a pizza')).toBeNull();
    expect(findKnowledge('')).toBeNull();
  });

  it('entries that map to a command carry a valid action for the answer card', () => {
    expect(findKnowledge('what is auto rotate')?.action?.command).toBe(
      'toggle-auto-rotate',
    );
    expect(findKnowledge('what is dark mode')?.action?.command).toBe(
      'set-theme',
    );
  });
});
