import {
  findKnowledge,
  suggestKnowledge,
} from '../../../managers/command-registry/knowledge-base';

/**
 * Answering requires high confidence (a wrong explanation is the worst failure
 * for a tutor), so an aggressive typo falls short of an answer. It becomes a
 * "did you mean ...?" instead, which recovers the student without ever
 * lowering the bar for what counts as an answer.
 */
describe('suggestKnowledge: offer the near-miss topic', () => {
  const nearMisses: [string, string][] = [
    ['what is a foton', 'photon'],
    ['explain foton', 'photon'],
    ['what is trigerr', 'trigger'],
    ['whats trigerr', 'trigger'],
  ];

  for (const [q, id] of nearMisses) {
    it(`"${q}" is not answered outright, but suggests ${id}`, () => {
      expect(findKnowledge(q)).toBeNull();
      expect(suggestKnowledge(q)?.id).toBe(id);
    });
  }

  it('offers nothing when the question is answered confidently', () => {
    expect(findKnowledge('what is a photon')?.id).toBe('photon');
    expect(suggestKnowledge('what is a photon')).toBeNull();
  });

  it('offers nothing for genuinely out-of-scope questions', () => {
    for (const q of [
      'what is photosynthesis',
      'how do i cook pasta',
      'who won the world cup',
      'what is the stock price',
    ]) {
      expect(suggestKnowledge(q)).toBeNull();
    }
  });
});
