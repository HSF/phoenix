import {
  detectQuestionIntent,
  findKnowledge,
  selectFacet,
  KNOWLEDGE_BASE,
} from '../../../managers/command-registry/knowledge-base';

/**
 * The tutor must answer the RIGHT KIND of question, not just find the right
 * topic. "what is the kinematics panel" (definition) and "how do I use the
 * kinematics panel" (procedure) are different questions about the same topic
 * and must give different answers.
 */

describe('detectQuestionIntent', () => {
  const cases: [string, string][] = [
    ['what is the kinematics panel', 'definition'],
    ['what is a jet', 'definition'],
    ['define eta', 'definition'],
    ['tell me about tracks', 'definition'],
    ['how can i use the kinematics panel ?', 'howto'],
    ['how do i use the eta phi panel', 'howto'],
    ['how do i hide the calorimeter', 'howto'],
    ['how to filter tracks', 'howto'],
    ['how does clipping work', 'howto'],
    ['why do we use eta', 'why'],
    ['why does pileup matter', 'why'],
    ['whats the point of clipping', 'why'],
    ['where is the kinematics panel', 'where'],
    ['where do i find the collections', 'where'],
    ['difference between a track and a hit', 'compare'],
    ['track vs hit', 'compare'],
    ['what can i ask you', 'meta'],
    ['what can you do', 'meta'],
    ['help', 'meta'],
  ];
  for (const [q, intent] of cases) {
    it(`"${q}" -> ${intent}`, () => {
      expect(detectQuestionIntent(q)).toBe(intent);
    });
  }
});

describe('selectFacet: returns the facet the student asked for', () => {
  it('a how-to question returns the how-to steps, not the definition', () => {
    const entry = findKnowledge('how can i use the kinematics panel')!;
    expect(entry.id).toBe('kinematics');
    const facet = selectFacet(entry, 'howto');
    expect(facet.requested).toBe(true);
    expect(facet.text).toBe(entry.howto);
    expect(facet.text).not.toBe(entry.body);
  });

  it('a definition question returns the definition', () => {
    const entry = findKnowledge('what is the kinematics panel')!;
    const facet = selectFacet(entry, 'definition');
    expect(facet.text).toBe(entry.body);
  });

  it('falls back to the definition (flagged) when a facet is missing', () => {
    const entry = {
      id: 'x',
      title: 'X',
      aliases: ['x'],
      body: 'A definition.',
    };
    const facet = selectFacet(entry as any, 'howto');
    expect(facet.text).toBe('A definition.');
    expect(facet.requested).toBe(false);
  });
});

describe('how-to coverage for the features students actually touch', () => {
  const mustHaveHowto = [
    'kinematics',
    'eta-phi',
    'clipping',
    'geometry-browser',
    'collections-info',
    'masterclass',
    'cuts',
    'event-browser',
    'screenshot',
    'object-selection',
  ];
  for (const id of mustHaveHowto) {
    it(`${id} has real how-to steps`, () => {
      const entry = KNOWLEDGE_BASE.find((e) => e.id === id)!;
      expect(entry).toBeDefined();
      expect(typeof entry.howto).toBe('string');
      expect(entry.howto!.length).toBeGreaterThan(40);
    });
  }
});

describe('task recipes: cross-topic "how do I ..." questions', () => {
  const tasks: [string, string][] = [
    ['how do i filter tracks above 20 gev', 'task-filter-tracks'],
    ['how do i only show high pt tracks', 'task-filter-tracks'],
    ['how do i measure the invariant mass', 'task-invariant-mass'],
    ['how do i measure the mass of two muons', 'task-invariant-mass'],
    ['how do i take a screenshot', 'screenshot'],
    ['how do i save a picture for my report', 'screenshot'],
    ['how do i share what i am looking at', 'share-link'],
    ['how do i see the numbers for a track', 'task-inspect-object'],
    ['how do i look inside the detector', 'clipping'],
  ];
  for (const [q, id] of tasks) {
    it(`"${q}" -> ${id}`, () => {
      expect(findKnowledge(q)?.id).toBe(id);
    });
  }
});

describe('CERN / HEP ecosystem coverage (not just Phoenix)', () => {
  const topics: [string, string][] = [
    ['what is cern', 'cern'],
    ['what is the lhc', 'lhc'],
    ['how big is the lhc', 'lhc'],
    ['what is a particle accelerator', 'accelerator'],
    ['what energy does the lhc run at', 'lhc-energy'],
    ['is the lhc dangerous', 'lhc-safety'],
    ['can the lhc make a black hole', 'lhc-safety'],
    ['what experiments are at the lhc', 'lhc-experiments'],
    ['what is alice', 'alice'],
    ['what is open data', 'open-data'],
    ['what is a masterclass', 'masterclass'],
  ];
  for (const [q, id] of topics) {
    it(`"${q}" -> ${id}`, () => {
      expect(findKnowledge(q)?.id).toBe(id);
    });
  }

  it('states LHC facts accurately (27 km, 13.6 TeV, four main experiments)', () => {
    const lhc = KNOWLEDGE_BASE.find((e) => e.id === 'lhc')!;
    expect(lhc.body).toMatch(/27\s?km|26\s?659/);
    const energy = KNOWLEDGE_BASE.find((e) => e.id === 'lhc-energy')!;
    expect(energy.body).toContain('13.6');
    const exps = KNOWLEDGE_BASE.find((e) => e.id === 'lhc-experiments')!;
    for (const name of ['ATLAS', 'CMS', 'ALICE', 'LHCb'])
      expect(exps.body).toContain(name);
  });
});

describe('meta: what can I ask', () => {
  it('has a help entry listing what the tutor covers', () => {
    const entry = findKnowledge('what can i ask you');
    expect(entry?.id).toBe('help');
    expect(entry!.body.length).toBeGreaterThan(60);
  });
});
