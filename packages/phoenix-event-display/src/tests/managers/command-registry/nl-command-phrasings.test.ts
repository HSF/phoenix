import { keywordFallback } from '../../../managers/command-registry/nl-intent';
import {
  findKnowledge,
  isConceptQuestion,
} from '../../../managers/command-registry/knowledge-base';

/**
 * Command robustness corpus: a masterclass student will phrase an ACTION in
 * many different ways, and often with typos. The deterministic fallback (the
 * path that works with no model at all) must map the natural phrasings to the
 * right command, and must never mistake an action for a question.
 *
 * The rule under test is "no confusion": a phrasing either maps to the right
 * command or declines. It must never map to a DIFFERENT command.
 */

/** How a student might really ask for each action. */
const COMMAND_PHRASINGS: { command: string; phrases: string[] }[] = [
  {
    command: 'next-event',
    phrases: [
      'next event',
      'next',
      'go to the next event',
      'show me the next event',
      'move to the next event',
      'can i see the next event',
      'lets see the next one',
      'next collision please',
      'advance to the next event',
      'skip to the next event',
      'i want the next event',
      'nex event',
      'next evnt',
    ],
  },
  {
    command: 'previous-event',
    phrases: [
      'previous event',
      'go back',
      'go back one event',
      'previous',
      'show the previous event',
      'take me back to the last event',
      'i want to see the previous event',
      'prev event',
      'previus event',
    ],
  },
  {
    command: 'set-theme',
    phrases: [
      'dark mode',
      'switch to dark mode',
      'make it dark',
      'turn on dark mode',
      'i prefer dark mode',
      'can you make the background dark',
      'night mode please',
      'dark theme',
      'darkmode',
      'drak mode',
    ],
  },
  {
    command: 'toggle-auto-rotate',
    phrases: [
      'spin the detector',
      'make it spin',
      'rotate the detector',
      'start spinning',
      'can you spin it',
      'auto rotate',
      'turn on auto rotate',
      'keep it rotating',
      'spin it around',
      'stop spinning',
      'stop the rotation',
      'please stop rotating',
      'spinn the detector',
    ],
  },
  {
    command: 'show-axis',
    phrases: [
      'show the axes',
      'show axis',
      'display the axes',
      'turn on the axes',
      'i want to see the axes',
      'can you show the axis',
      'hide the axes',
      'turn off the axis',
      'remove the axes',
      'show the axies',
    ],
  },
  {
    command: 'zoom',
    phrases: [
      'zoom in',
      'zoom out',
      'zoom in closer',
      'can you zoom in',
      'zoom out a bit',
      'zoom in please',
      'zoom out further',
      'zoomin',
    ],
  },
  {
    command: 'set-clipping',
    phrases: [
      'turn on clipping',
      'enable clipping',
      'clip the detector',
      'can you clip it',
      'turn off clipping',
      'disable clipping',
      'remove the clipping',
      'cliping on',
    ],
  },
  {
    command: 'toggle-camera-projection',
    phrases: [
      'switch to orthographic',
      'use orthographic',
      'orthographic view',
      'switch the projection',
      'change the camera projection',
      'use a perspective camera',
      'perspective view',
      'orthograpic',
    ],
  },
];

describe('command phrasings: a student says it many ways', () => {
  it('maps every natural phrasing to the right command (or declines, never a wrong one)', () => {
    const wrong: string[] = [];
    const declined: string[] = [];
    let total = 0;
    for (const { command, phrases } of COMMAND_PHRASINGS) {
      for (const phrase of phrases) {
        total++;
        const got = keywordFallback(phrase)?.command ?? null;
        if (got === null) declined.push(phrase);
        else if (got !== command)
          wrong.push(`"${phrase}" -> ${got} (want ${command})`);
      }
    }
    // ZERO wrong mappings is the hard requirement (no confusion).
    expect({ wrong: wrong.slice(0, 10) }).toEqual({ wrong: [] });
    // And the fallback should recognise the large majority of natural phrasings.
    const hitRate = (total - declined.length) / total;
    if (hitRate < 0.85) {
      console.log(
        `command hit rate ${(hitRate * 100).toFixed(1)}%, declined:`,
        declined,
      );
    }
    expect({ ok: hitRate >= 0.85 }).toEqual({ ok: true });
  });

  it('never mistakes an action for a knowledge question', () => {
    const misrouted: string[] = [];
    for (const { phrases } of COMMAND_PHRASINGS) {
      for (const phrase of phrases) {
        // A plain command phrasing must not be routed to the tutor.
        if (isConceptQuestion(phrase)) misrouted.push(phrase);
      }
    }
    expect(misrouted).toEqual([]);
  });

  it('polite/indirect phrasings still reach a command, not a definition', () => {
    // These read like questions but are really requests to DO something.
    //
    // MATCHER LAYER ONLY. This proves keywordFallback maps them; it cannot see
    // whether ask() routes them to the matcher at all. It passed while
    // ask("next event?") returned a definition with ok:true and ran nothing,
    // because routing happens above this function. The shipping-path gate,
    // which drives ask() over this whole corpus with and without a trailing
    // "?" and checks the command really executed, is
    // phoenix-ng ask-routing.service.test.ts.
    const requests: [string, string][] = [
      ['can you show the axes', 'show-axis'],
      ['could you zoom in', 'zoom'],
      ['can you make it dark', 'set-theme'],
      ['can you spin the detector', 'toggle-auto-rotate'],
    ];
    for (const [phrase, command] of requests) {
      expect(keywordFallback(phrase)?.command).toBe(command);
    }
  });

  it('a question about a topic is NOT executed as a command', () => {
    // The mirror case: these must reach the tutor, not fire an action.
    const questions = [
      'what is auto rotate',
      'what is clipping',
      'how do i zoom in',
      'why do we use dark mode',
    ];
    for (const q of questions) {
      expect(isConceptQuestion(q)).toBe(true);
      expect(findKnowledge(q)).not.toBeNull();
    }
  });

  it('tolerates typos in commands (students mistype constantly)', () => {
    // A student typing fast must still get their command. Verified live: these
    // exact strings previously did nothing at all.
    const typos: [string, string][] = [
      ['cliping on', 'set-clipping'],
      ['orthograpic', 'toggle-camera-projection'],
    ];
    const bad: string[] = [];
    for (const [phrase, command] of typos) {
      const got = keywordFallback(phrase)?.command ?? null;
      if (got !== command) bad.push(`"${phrase}" -> ${got} (want ${command})`);
    }
    expect(bad).toEqual([]);
  });

  it('declines typos of SHORT command words rather than risk a wrong action', () => {
    // A command mutates the display, so fuzziness is opt-in per keyword. Short
    // stems (spin, next, axes, clip, light) collide with ordinary English
    // (spine, next door, taxes, eclipse, flight), so a typo of one is declined
    // instead of guessing. Longer distinctive words ARE typo-tolerant above.
    for (const phrase of [
      'spinn the detector',
      'nex event',
      'drak mode',
      'dakr mode',
      'show the axies',
      'zomm in',
    ]) {
      expect(keywordFallback(phrase)).toBeNull();
    }
  });

  it('typo tolerance never creates a WRONG command', () => {
    // The safety half: fuzzy matching must not turn unrelated words into
    // actions. These are near-misses that must still decline.
    const notCommands = [
      'darn it',
      'spine of the detector',
      'taxes',
      'eclipse',
      'zoo animals',
      'lightning',
    ];
    for (const phrase of notCommands) {
      const got = keywordFallback(phrase)?.command ?? null;
      expect({ phrase, got }).toEqual({ phrase, got: null });
    }
  });
});
