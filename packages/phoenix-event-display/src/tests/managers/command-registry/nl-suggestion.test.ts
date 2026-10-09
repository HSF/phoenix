import {
  keywordFallback,
  suggestCommand,
} from '../../../managers/command-registry/nl-intent';

/**
 * "Did you mean ...?" for near-miss commands.
 *
 * A typo of a SHORT command word ("drak mode", "nex event") must never fire
 * automatically: those words are one edit from ordinary English ("darn",
 * "next door"), so guessing would mutate the display on a coincidence. But
 * silently doing nothing loses the student. The resolution is the one git
 * itself uses for a mistyped subcommand: do not execute, SUGGEST.
 */
describe('suggestCommand: propose, never execute', () => {
  const cases: [string, string][] = [
    ['drak mode', 'set-theme'],
    ['dakr mode', 'set-theme'],
    ['nex event', 'next-event'],
    ['spinn the detector', 'toggle-auto-rotate'],
    ['show the axies', 'show-axis'],
    ['zomm in', 'zoom'],
  ];

  for (const [text, command] of cases) {
    it(`"${text}" suggests ${command} (but does not run it)`, () => {
      // The direct path still refuses: nothing is executed on a guess.
      expect(keywordFallback(text)).toBeNull();
      // The suggestion path offers the likely intent for confirmation.
      const s = suggestCommand(text);
      expect(s?.intent.command).toBe(command);
      // It reports the word it corrected, so the UI can explain itself.
      expect(typeof s?.corrected).toBe('string');
    });
  }

  it('a longer typo that the stem already covers maps directly (no suggestion needed)', () => {
    // "cliping" starts with "clip", so the strict matcher already understands
    // it. Suggestions are only for what the matcher genuinely cannot read.
    expect(keywordFallback('cliping on')?.command).toBe('set-clipping');
    expect(suggestCommand('cliping on')).toBeNull();
  });

  it('says nothing for text that is not about the display at all', () => {
    // No supporting context word, so no proposal appears out of nowhere.
    for (const text of ['darn it', 'taxes', 'eclipse', 'a spine']) {
      expect(suggestCommand(text)).toBeNull();
    }
  });

  it('may propose for an odd near-miss, but still executes nothing', () => {
    // "spine of the detector" is one edit from "spin" and does mention the
    // detector, so a proposal is reasonable. The guarantee that matters is
    // that it is only ever a proposal: the strict matcher still refuses.
    expect(keywordFallback('spine of the detector')).toBeNull();
    const s = suggestCommand('spine of the detector');
    if (s) expect(s.intent.command).toBe('toggle-auto-rotate');
  });

  it('does not suggest when the request already maps exactly', () => {
    expect(suggestCommand('dark mode')).toBeNull();
    expect(suggestCommand('next event')).toBeNull();
  });

  it('does not suggest for unrelated text', () => {
    for (const text of ['make me a coffee', 'what is a jet', '', 'asdfgh']) {
      expect(suggestCommand(text)).toBeNull();
    }
  });
});
