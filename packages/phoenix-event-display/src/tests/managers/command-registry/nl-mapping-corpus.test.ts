import { CommandRegistry } from '../../../managers/command-registry/command-registry';
import { registerDefaultCommands } from '../../../managers/command-registry/default-commands';
import type { CommandHost } from '../../../managers/command-registry/command-host';
import {
  keywordFallback,
  validateIntent,
} from '../../../managers/command-registry/nl-intent';

/**
 * Large-scale mapping corpus for the deterministic keyword fallback (#942).
 *
 * The fallback is intentionally limited: it maps a handful of clear phrasings
 * and otherwise returns null (the model handles the long tail). The property it
 * MUST hold, though, is ZERO CONFUSION: it must never map a request to a
 * *different* command than intended. Thousands of generated phrasings assert:
 *   1. clear requests map to the RIGHT command with the RIGHT args, and
 *   2. confusable / off-topic requests never map to a WRONG command
 *      (returning null is always acceptable for the fallback).
 * This is the regression guard for substring-collision bugs like
 * "highlight" -> "light" -> set-theme, and doubles as the seed corpus for the
 * on-GPU model evaluation.
 */

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

// Politeness / framing wrappers applied around each core phrase.
const PREFIXES = [
  '',
  'please ',
  'can you ',
  'could you please ',
  'hey ',
  'now ',
  'ok ',
  'i want to ',
  "let's ",
  'go ahead and ',
];
const SUFFIXES = ['', ' please', ' now', ' for me', ' thanks'];

/** Cartesian expand of prefixes x cores x suffixes into unique phrases. */
function expand(cores: string[]): string[] {
  const out = new Set<string>();
  for (const p of PREFIXES) {
    for (const c of cores) {
      for (const s of SUFFIXES) out.add(`${p}${c}${s}`.trim());
    }
  }
  return [...out];
}

const cmd = (text: string) => keywordFallback(text)?.command ?? null;

// ---------------------------------------------------------------------------
// MUST-MAP sets: each core contains a real fallback trigger.
// ---------------------------------------------------------------------------
const SPIN_ON = [
  'spin the detector',
  'spin the scene',
  'start spinning',
  'keep spinning',
  'make it spin',
  'auto rotate',
  'auto-rotate the view',
  'autorotate',
  'turn on auto rotate',
  'enable auto-rotate',
  'rotate the detector',
  'rotate the scene continuously',
];
const SPIN_OFF = [
  'stop spinning',
  'stop the spin',
  'stop rotating',
  'stop the rotation',
  'turn off auto rotate',
  'disable auto-rotate',
  'stop auto-rotating',
];
const NEXT = [
  'next',
  'next event',
  'next collision',
  'go to the next event',
  'move to the next event',
  'skip to the next event',
  'show me the next event',
  'advance to the next event',
];
const PREV = [
  'previous event',
  'the previous event',
  'go to the previous event',
  'prev event',
  'the last event',
  'go back one event',
  'go back to the last event',
];
const DARK = [
  'dark',
  'dark mode',
  'dark theme',
  'switch to dark mode',
  'make it dark',
  'night mode',
  'use a darker background',
];
const LIGHT = [
  'light mode',
  'light theme',
  'switch to light mode',
  'use a light background',
  'make it lighter',
];
const ZOOM_IN = ['zoom in', 'zoom in closer', 'zoom closer', 'zoom in a bit'];
const ZOOM_OUT = [
  'zoom out',
  'zoom away',
  'zoom out a bit',
  'zoom out further',
];
const AXIS_SHOW = [
  'show axis',
  'show the axes',
  'display the axes',
  'turn on the axis',
];
const AXIS_HIDE = [
  'hide axis',
  'hide the axes',
  'remove the axes',
  'turn off the axis',
];
const PROJECTION = [
  'orthographic',
  'perspective',
  'orthographic view',
  'switch the projection',
  'toggle camera projection',
  'use a perspective camera',
];
const CLIP_ON = [
  'enable clipping',
  'turn on clipping',
  'clip the detector',
  'clipping on',
];
const CLIP_OFF = [
  'disable clipping',
  'turn off clipping',
  'remove clipping',
  'no clipping',
];

// ---------------------------------------------------------------------------
// MUST-NOT-MISMAP sets: confusable / off-topic. Fallback may return null but
// must NEVER return the listed forbidden command(s).
// ---------------------------------------------------------------------------
const VIEWS = [
  'front',
  'back',
  'left',
  'right',
  'top',
  'bottom',
  'side',
  'transverse',
  'longitudinal',
  'isometric',
  'home',
  'default',
];
const ROTATE_TO_VIEW = VIEWS.flatMap((v) => [
  `rotate to the ${v} view`,
  `rotate to ${v}`,
  `rotate towards the ${v} view`,
  `rotate into the ${v} orientation`,
  `turn to the ${v} view`,
  `snap to the ${v} view`,
  `show the two muons and rotate to the ${v} view`,
]);

// Substring-collision traps: the word on the left CONTAINS a trigger token.
const LIGHT_TRAPS = [
  'highlight the first track',
  'highlight the muon',
  'highlight this jet',
  'highlight track number two',
  'the highlight of the event',
  'book a flight home',
  'a delightful display',
  'point the spotlight',
  'that is slightly off',
];
const NEXT_TRAPS = [
  'show me the context menu',
  'what is the context here',
  'explain the context',
];
const OTHER_TRAPS = [
  'show the spine of the detector', // spine ~ spin
  'calculate the taxes', // taxes ~ axes
  'during the solar eclipse', // eclipse ~ clip
  'adjust the offset', // offset ~ off/negation
  'reset the offset value',
];
// Unsupported physics + geometry (no fallback command; must decline, model
// handles them). None contain a trigger token, so all must be null.
const UNSUPPORTED = [
  'filter tracks above 20 GeV',
  'only show tracks with pt over 5 GeV',
  'cut on eta below 2.5',
  'fit a vertex to these tracks',
  'compute the invariant mass of the two muons',
  'hide the calorimeter',
  'hide the muon chambers',
  'show the pixel detector',
  'make the inner tracker transparent',
];
const OFFTOPIC = [
  'make me a coffee',
  'what is the weather today',
  'order a pizza',
  'tell me a joke',
  'send an email to my supervisor',
  'play some music',
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('nl mapping corpus (deterministic fallback, zero confusion)', () => {
  /** Assert every phrase maps to exactly `want` (command) with optional args. */
  function mustMap(
    label: string,
    cores: string[],
    want: string,
    args?: Record<string, any>,
  ) {
    const phrases = expand(cores);
    const bad: string[] = [];
    for (const text of phrases) {
      const intent = keywordFallback(text);
      if (!intent || intent.command !== want) {
        bad.push(`"${text}" -> ${intent?.command ?? 'null'}`);
        continue;
      }
      if (args) {
        for (const k of Object.keys(args)) {
          if (intent.args?.[k] !== args[k]) {
            bad.push(
              `"${text}" arg ${k}=${intent.args?.[k]} (want ${args[k]})`,
            );
          }
        }
      }
    }
    expect({ label, count: phrases.length, bad: bad.slice(0, 12) }).toEqual({
      label,
      count: phrases.length,
      bad: [],
    });
  }

  /** Assert no phrase maps to any command in `forbidden`. */
  function mustNotMap(label: string, phrases: string[], forbidden: string[]) {
    const expanded = expand(phrases);
    const bad: string[] = [];
    for (const text of expanded) {
      const got = cmd(text);
      if (got && forbidden.includes(got)) bad.push(`"${text}" -> ${got}`);
    }
    expect({ label, count: expanded.length, bad: bad.slice(0, 12) }).toEqual({
      label,
      count: expanded.length,
      bad: [],
    });
  }

  it('maps spin/auto-rotate ON', () =>
    mustMap('spin-on', SPIN_ON, 'toggle-auto-rotate', { on: true }));
  it('maps spin/auto-rotate OFF', () =>
    mustMap('spin-off', SPIN_OFF, 'toggle-auto-rotate', { on: false }));
  it('maps next-event', () => mustMap('next', NEXT, 'next-event'));
  it('maps previous-event', () => mustMap('prev', PREV, 'previous-event'));
  it('maps dark theme', () =>
    mustMap('dark', DARK, 'set-theme', { dark: true }));
  it('maps light theme', () =>
    mustMap('light', LIGHT, 'set-theme', { dark: false }));
  it('maps zoom in', () =>
    mustMap('zoom-in', ZOOM_IN, 'zoom', { direction: 'in' }));
  it('maps zoom out', () =>
    mustMap('zoom-out', ZOOM_OUT, 'zoom', { direction: 'out' }));
  it('maps show axis', () =>
    mustMap('axis-show', AXIS_SHOW, 'show-axis', { show: true }));
  it('maps hide axis', () =>
    mustMap('axis-hide', AXIS_HIDE, 'show-axis', { show: false }));
  it('maps camera projection', () =>
    mustMap('projection', PROJECTION, 'toggle-camera-projection'));
  it('maps clipping ON', () =>
    mustMap('clip-on', CLIP_ON, 'set-clipping', { on: true }));
  it('maps clipping OFF', () =>
    mustMap('clip-off', CLIP_OFF, 'set-clipping', { on: false }));

  it('never treats "rotate to a view" as auto-rotate', () =>
    mustNotMap('rotate-to-view', ROTATE_TO_VIEW, ['toggle-auto-rotate']));
  it('never treats "highlight"/"flight"/"delight" as a theme change', () =>
    mustNotMap('light-traps', LIGHT_TRAPS, ['set-theme']));
  it('never treats "context" as next-event', () =>
    mustNotMap('next-traps', NEXT_TRAPS, ['next-event']));
  it('never mis-maps spine/taxes/eclipse/offset traps', () =>
    mustNotMap('other-traps', OTHER_TRAPS, [
      'toggle-auto-rotate',
      'show-axis',
      'set-clipping',
    ]));

  it('declines (null) unsupported physics + geometry requests', () => {
    const bad: string[] = [];
    for (const text of expand(UNSUPPORTED)) {
      const got = cmd(text);
      if (got !== null) bad.push(`"${text}" -> ${got}`);
    }
    expect(bad.slice(0, 12)).toEqual([]);
  });

  it('declines (null) off-topic requests', () => {
    const bad: string[] = [];
    for (const text of expand(OFFTOPIC)) {
      const got = cmd(text);
      if (got !== null) bad.push(`"${text}" -> ${got}`);
    }
    expect(bad.slice(0, 12)).toEqual([]);
  });

  it('directional integrity: dark != light, next != previous, in != out', () => {
    // No dark phrase yields light theme and vice versa.
    for (const text of expand(DARK))
      expect(keywordFallback(text)?.args?.dark).not.toBe(false);
    for (const text of expand(LIGHT))
      expect(keywordFallback(text)?.args?.dark).not.toBe(true);
    for (const text of expand(NEXT))
      expect(cmd(text)).not.toBe('previous-event');
    for (const text of expand(PREV)) expect(cmd(text)).not.toBe('next-event');
    for (const text of expand(ZOOM_IN))
      expect(keywordFallback(text)?.args?.direction).not.toBe('out');
    for (const text of expand(ZOOM_OUT))
      expect(keywordFallback(text)?.args?.direction).not.toBe('in');
  });

  it('every non-null fallback intent validates against the registry', () => {
    const r = reg();
    const all = [
      ...expand(SPIN_ON),
      ...expand(SPIN_OFF),
      ...expand(NEXT),
      ...expand(PREV),
      ...expand(DARK),
      ...expand(LIGHT),
      ...expand(ZOOM_IN),
      ...expand(ZOOM_OUT),
      ...expand(AXIS_SHOW),
      ...expand(AXIS_HIDE),
      ...expand(PROJECTION),
      ...expand(CLIP_ON),
      ...expand(CLIP_OFF),
      ...expand(ROTATE_TO_VIEW),
      ...expand(LIGHT_TRAPS),
      ...expand(UNSUPPORTED),
      ...expand(OFFTOPIC),
    ];
    const bad: string[] = [];
    for (const text of all) {
      const intent = keywordFallback(text);
      if (intent && !validateIntent(intent, r).ok)
        bad.push(`"${text}" -> ${intent.command} did not validate`);
    }
    expect({ total: all.length, bad: bad.slice(0, 12) }).toEqual({
      total: all.length,
      bad: [],
    });
  });
});
