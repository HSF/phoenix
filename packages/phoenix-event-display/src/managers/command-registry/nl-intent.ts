import type {
  CommandParamSchema,
  CommandProperty,
  McpToolShape,
} from './command.model';
import { validateArgs } from './schema-validator';

/**
 * Natural-language intent layer for the command registry (#942, Phase 3).
 *
 * Pure, framework-agnostic, dependency-free helpers that turn the registry
 * into (a) a CONSTRAINED JSON schema and system prompt a small in-browser LLM
 * decodes against, and (b) a deterministic keyword fallback for when no model
 * is available. The model can only ever pick a REGISTERED command and fill its
 * typed arguments; everything is re-validated here and again by the registry
 * before running, so a wrong word can never fire a wrong (or physics-altering)
 * action. The heavy WebLLM engine and the UI live in the app layer; this file
 * stays pure so it is unit-testable without a browser or a model.
 */

/** A model- or rule-produced command choice. */
export interface Intent {
  /** The chosen command name (must be a registered command). */
  command: string;
  /** The command arguments. */
  args: Record<string, any>;
}

/** Result of validating a proposed intent against the registry. */
export type IntentResult =
  | { ok: true; command: string; args: Record<string, any> }
  | { ok: false; error: string; none?: boolean };

/** Live values that fill an `enumSource` parameter, keyed by source name. */
export type EnumSources = Partial<
  Record<NonNullable<CommandProperty['enumSource']>, string[]>
>;

/** Minimal registry surface needed to validate an intent. */
interface CommandLookup {
  /**
   * Look up a registered command by name.
   * @param name The command name.
   * @returns The command's input schema holder, or undefined when unregistered.
   */
  get(name: string): { inputSchema: CommandParamSchema } | undefined;
}

/**
 * Convert a command's input schema into a plain JSON-Schema args object,
 * resolving (or stripping) `enumSource`, which is not a JSON-Schema keyword and
 * must never reach the grammar. When live values are supplied for a source the
 * parameter is pinned to that concrete `enum`; otherwise it is left a plain
 * typed field the registry validates after the fact.
 * @param input The command's input schema.
 * @param enums Live enum values keyed by source name.
 * @returns A JSON-Schema object describing the command's arguments.
 */
function toArgsSchema(input: CommandParamSchema, enums?: EnumSources): any {
  const properties: Record<string, any> = {};
  for (const [name, prop] of Object.entries(input.properties ?? {})) {
    const p: any = { type: prop.type };
    if (prop.description) p.description = prop.description;
    if (prop.enum) {
      p.enum = [...prop.enum];
    } else if (prop.enumSource && enums?.[prop.enumSource]?.length) {
      p.enum = [...(enums[prop.enumSource] as string[])];
    }
    if (prop.minimum !== undefined) p.minimum = prop.minimum;
    if (prop.maximum !== undefined) p.maximum = prop.maximum;
    properties[name] = p;
  }
  const schema: any = {
    type: 'object',
    properties,
    additionalProperties: false,
  };
  if (input.required?.length) schema.required = [...input.required];
  return schema;
}

/** One `oneOf` branch pinning `command` to a name and `args` to its schema. */
function branch(name: string, args: any): any {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['command', 'args'],
    properties: { command: { const: name }, args },
  };
}

/**
 * Build the stringified JSON schema a constrained decoder (WebLLM/XGrammar)
 * uses so the model can ONLY emit `{command, args}` for a registered command,
 * or `{command:'none', args:{}}` when nothing matches. This is the physics-
 * safety core: the grammar makes an unregistered or malformed action
 * structurally impossible.
 * @param tools The registry's MCP tool shapes.
 * @param enums Optional live enum values to pin `enumSource` parameters.
 * @returns The schema as a JSON string (WebLLM's `response_format.schema`).
 */
export function buildIntentSchema(
  tools: McpToolShape[],
  enums?: EnumSources,
): string {
  const oneOf = tools.map((t) =>
    branch(t.name, toArgsSchema(t.inputSchema, enums)),
  );
  oneOf.push(
    branch('none', {
      type: 'object',
      properties: {},
      additionalProperties: false,
    }),
  );
  return JSON.stringify({ oneOf });
}

/** One worked few-shot example: a phrasing and the intent it should map to. */
interface FewShot {
  /** The phrasing a user might type. */
  q: string;
  /** The command it should map to, or 'none' when nothing applies. */
  command: string;
  /** The arguments that command should receive. */
  args: Record<string, any>;
}

/**
 * Canonical few-shot examples spanning command categories. Only examples whose
 * command is actually registered (or the `none` escape) are shown, so the
 * prompt stays correct if the command set changes. Small instruct models map
 * intent far more reliably with a few concrete examples than from a bare list.
 * These are ALWAYS included; the extended bank below is added by relevance.
 */
const FEWSHOT_EXAMPLES: FewShot[] = [
  { q: 'go to the next event', command: 'next-event', args: {} },
  {
    q: 'hide the calorimeter',
    command: 'set-geometry-visibility',
    args: { part: 'calorimeter', visible: false },
  },
  { q: 'make the background dark', command: 'set-theme', args: { dark: true } },
  { q: 'spin the detector', command: 'toggle-auto-rotate', args: { on: true } },
  {
    q: 'what collections are in this event',
    command: 'list-collections',
    args: {},
  },
  { q: 'order me a pizza', command: 'none', args: {} },
];

/**
 * A larger bank of paraphrases the prompt draws from BY RELEVANCE to the live
 * request (dynamic / retrieval few-shot). Research on small models shows that
 * showing the few examples closest to the actual query lifts intent accuracy
 * well beyond a fixed set, without bloating the prompt (which slows a browser
 * model). Kept separate from the always-on core so the base prompt stays
 * deterministic. Values are illustrative: constrained decoding still forces
 * every argument to a real, live enum value.
 */
const EXTENDED_EXAMPLES: FewShot[] = [
  { q: 'go back to the previous event', command: 'previous-event', args: {} },
  { q: 'switch to light mode', command: 'set-theme', args: { dark: false } },
  { q: 'stop rotating', command: 'toggle-auto-rotate', args: { on: false } },
  {
    q: 'keep the detector spinning',
    command: 'toggle-auto-rotate',
    args: { on: true },
  },
  {
    q: 'show the muon spectrometer',
    command: 'set-geometry-visibility',
    args: { part: 'muon', visible: true },
  },
  {
    q: 'turn the pixel detector back on',
    command: 'set-geometry-visibility',
    args: { part: 'pixel', visible: true },
  },
  { q: 'zoom in closer', command: 'zoom', args: { direction: 'in' } },
  { q: 'zoom out a bit', command: 'zoom', args: { direction: 'out' } },
  { q: 'show the axes', command: 'show-axis', args: { show: true } },
  { q: 'hide the axis helper', command: 'show-axis', args: { show: false } },
  { q: 'enable clipping', command: 'set-clipping', args: { on: true } },
  {
    q: 'switch to an orthographic camera',
    command: 'toggle-camera-projection',
    args: { orthographic: true },
  },
  {
    q: 'highlight the first track',
    command: 'highlight-object',
    args: { collection: 'Tracks', index: 0 },
  },
  {
    q: 'point the camera at the second jet',
    command: 'look-at-object',
    args: { collection: 'Jets', index: 1 },
  },
  { q: 'describe this event', command: 'describe-event', args: {} },
  // Honest no-match teaching: a plausible-but-unsupported physics request.
  { q: 'filter tracks above 20 GeV', command: 'none', args: {} },
  { q: 'delete all the events', command: 'none', args: {} },
];

/** Lowercase content tokens of a phrase (drops short/stopword-ish tokens). */
function tokenize(text: string): string[] {
  const STOP = new Set([
    'the',
    'a',
    'an',
    'to',
    'of',
    'and',
    'me',
    'my',
    'in',
    'on',
    'is',
    'it',
    'this',
    'that',
    'please',
    'can',
    'you',
  ]);
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter(
    (w) => w.length > 1 && !STOP.has(w),
  );
}

/**
 * Rank a pool of examples by word-overlap with the query and return the top
 * `k`. A zero-dependency stand-in for embedding retrieval: it keeps the library
 * light (no model/tokenizer download) while still surfacing the examples most
 * like the request. Examples sharing no content word are dropped, not padded.
 * @param query The user's request.
 * @param pool Candidate examples.
 * @param k Maximum examples to return.
 * @returns The most relevant examples, most-similar first.
 */
function rankExamples(query: string, pool: FewShot[], k: number): FewShot[] {
  // The query is user text: bound it before tokenising, or a pasted
  // megabyte is scanned word by word while rendering is paused.
  const q = new Set(tokenize(sanitizeRequest(query)));
  if (!q.size) return [];
  return pool
    .map((ex) => {
      const toks = tokenize(ex.q);
      const overlap = toks.filter((t) => q.has(t)).length;
      // Normalize by example length so a short, on-point example wins ties.
      const score = overlap === 0 ? 0 : overlap + overlap / (toks.length + 1);
      return { ex, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((s) => s.ex);
}

/** Render a parameter with its type and, when known, its allowed values. */
function describeParam(
  name: string,
  prop: CommandProperty,
  enums?: EnumSources,
): string {
  let allowed = '';
  if (prop.enum) {
    allowed = `: ${prop.enum.join('|')}`;
  } else if (prop.enumSource && enums?.[prop.enumSource]?.length) {
    const values = enums[prop.enumSource] as string[];
    allowed = `: ${values.slice(0, 20).join('|')}${values.length > 20 ? '|...' : ''}`;
  }
  return `${name} (${prop.type}${allowed})`;
}

/**
 * Build the system prompt describing the available commands to the model,
 * with allowed argument values and a few worked examples. Passing the same
 * live `enums` used for the schema lets the model see real collection/part
 * names so it can map "the calorimeter" to an actual geometry part.
 * @param tools The registry's MCP tool shapes.
 * @param enums Optional live enum values to show valid argument choices.
 * @param query Optional live request; when given, the most relevant examples
 *   from the extended bank are added (dynamic / retrieval few-shot).
 * @returns A prompt listing every command, its arguments and examples.
 */
export function buildSystemPrompt(
  tools: McpToolShape[],
  enums?: EnumSources,
  query?: string,
): string {
  const names = new Set(tools.map((t) => t.name));
  const registered = (e: FewShot) =>
    e.command === 'none' || names.has(e.command);
  const render = (e: FewShot) =>
    `user: ${e.q}\n${JSON.stringify({ command: e.command, args: e.args })}`;
  const lines = tools.map((t) => {
    const params = Object.entries(t.inputSchema.properties ?? {})
      .map(([n, p]) => describeParam(n, p, enums))
      .join(', ');
    return `- ${t.name}: ${t.description}${params ? ` [args: ${params}]` : ''}`;
  });
  const examples = FEWSHOT_EXAMPLES.filter(registered).map(render);
  // Dynamic (retrieval) few-shot: add the extended examples most similar to the
  // live request, skipping any command already shown in the core set. Only when
  // a query is supplied (the base prompt stays fixed for tests/caching).
  if (query) {
    // Dedup by exact phrasing (not command): directional variants like
    // "stop rotating" vs the core "spin the detector" are DIFFERENT lessons
    // (on vs off) and both worth showing when relevant.
    const shown = new Set(FEWSHOT_EXAMPLES.map((e) => e.q));
    const relevant = rankExamples(
      query,
      EXTENDED_EXAMPLES.filter(registered).filter((e) => !shown.has(e.q)),
      4,
    );
    examples.push(...relevant.map(render));
  }
  // A live "rotate to <a real preset>" example, using an actual view name so
  // constrained decoding (which only allows real values) never contradicts it.
  // This is the single example the wild model needed: it teaches that
  // "rotate to a view" is a camera move, contrasting the "spin the detector"
  // example just above it. Only added when both intents actually exist.
  if (names.has('preset-view') && enums?.presetViews?.length) {
    const view = enums.presetViews[0];
    examples.push(
      `user: rotate to the ${view}\n${JSON.stringify({
        command: 'preset-view',
        args: { view },
      })}`,
    );
  }

  // Name the one word that mis-fired in the wild (rotate) so the model contrasts
  // a one-off camera move against continuous spinning. Only when both exist.
  const rules: string[] = [];
  if (names.has('preset-view') && names.has('toggle-auto-rotate')) {
    rules.push(
      'Disambiguation: "rotate to / snap to / go to the <name> view" is a one-off camera move -> preset-view. "spin", "auto-rotate" or "keep rotating" is continuous spinning -> toggle-auto-rotate. Never map "rotate to a view" to toggle-auto-rotate.',
    );
  }

  return [
    "You control a 3D particle-physics event display. Choose the ONE command whose purpose best matches the user's intent, and fill its arguments from the request.",
    'Reply with ONLY a compact JSON object {"command": "<name>", "args": {...}} and nothing else: no prose, no markdown.',
    'If no command matches, reply {"command": "none", "args": {}}. Never invent a command or an argument value.',
    ...rules,
    '',
    'Commands:',
    ...lines,
    '',
    'Examples:',
    ...examples,
  ].join('\n');
}

/**
 * Validate a proposed intent against the registry: the command must be
 * registered and its arguments must satisfy the command's schema. The sentinel
 * `none` is reported as an explicit no-match rather than an error.
 * @param parsed The parsed model/rule output.
 * @param registry The command registry (or any command lookup).
 * @returns A normalized ok result, or a reason it was rejected.
 */
export function validateIntent(
  parsed: unknown,
  registry: CommandLookup,
): IntentResult {
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return { ok: false, error: 'intent must be an object' };
  }
  const obj = parsed as Record<string, unknown>;
  const command = obj['command'];
  if (typeof command !== 'string' || command.length === 0) {
    return { ok: false, error: 'intent is missing a command' };
  }
  if (command === 'none') {
    return { ok: false, error: 'no matching command', none: true };
  }
  const cmd = registry.get(command);
  if (!cmd) {
    return { ok: false, error: `unknown command '${command}'` };
  }
  const args =
    obj['args'] !== undefined && obj['args'] !== null
      ? (obj['args'] as Record<string, any>)
      : {};
  const v = validateArgs(cmd.inputSchema, args);
  if (!v.valid) {
    return { ok: false, error: v.error ?? 'invalid arguments' };
  }
  return { ok: true, command, args };
}

/**
 * Defensively parse a model's text reply into an intent object. Constrained
 * decoding returns pure JSON, but this also tolerates markdown code fences and
 * surrounding prose by extracting the first balanced `{...}` block. Returns
 * null when no JSON object is present (never throws).
 * @param text The model's raw text output.
 * @returns The parsed object, or null.
 */
export function parseIntentJson(text: string): unknown {
  const raw = (text ?? '').trim();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    /* fall through to extraction */
  }
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start !== -1 && end > start) {
    try {
      return JSON.parse(raw.slice(start, end + 1));
    } catch {
      /* not valid JSON */
    }
  }
  return null;
}

/**
 * Deterministic keyword fallback used when no model is available (e.g. no
 * WebGPU). Maps a handful of common phrasings to safe, no-/simple-argument
 * commands, and returns `null` rather than ever guessing a command. Any intent
 * it returns is a registered command and passes `validateIntent`.
 * @param text The user's request.
 * @returns A mapped intent, or null when nothing clearly matches.
 */
/**
 * Command keywords that are safe to match with one typo. A command MUTATES the
 * display, so fuzziness is opt-in per word rather than global: only words that
 * are distinctive enough that a near-miss is far more likely to be a typo than
 * a different English word. Deliberately EXCLUDES short, collision-prone stems
 * (light/spin/axes/clip/next), where fuzzing would resurrect the very
 * confusions this fallback was rewritten to eliminate ("flight" -> theme,
 * "spine" -> auto-rotate, "taxes" -> axes, "eclipse" -> clipping).
 */
const TYPO_SAFE = new Set([
  'spinning',
  'detector',
  'rotate',
  'autorotate',
  'clipping',
  'orthographic',
  'perspective',
  'projection',
  'previous',
  'theme',
  'collections',
  'describe',
]);

/**
 * Whether `typed` is `target` with at most one typo: a single insertion,
 * deletion, substitution, or a swap of two adjacent letters ("axies"/"axes",
 * "drak"/"dark", "spinn"/"spin"). Deliberately strict, since a command
 * MUTATES the display: one edit only, and never for short words, so unrelated
 * words cannot become commands.
 * @param typed A word the user typed.
 * @param target A command keyword.
 * @returns True when they differ by at most one edit.
 */
function nearMiss(typed: string, target: string, minLength = 4): boolean {
  if (typed === target) return true;
  if (Math.abs(typed.length - target.length) > 1) return false;
  if (Math.min(typed.length, target.length) < minLength) return false;
  // Adjacent transposition (the most common human typo).
  if (typed.length === target.length) {
    let diffs = 0;
    let firstDiff = -1;
    for (let i = 0; i < typed.length; i++) {
      if (typed[i] !== target[i]) {
        diffs++;
        if (firstDiff === -1) firstDiff = i;
        if (diffs > 2) return false;
      }
    }
    if (diffs === 1) return true; // one substitution
    if (diffs === 2) {
      const i = firstDiff;
      return (
        typed[i] === target[i + 1] &&
        typed[i + 1] === target[i] &&
        typed.slice(i + 2) === target.slice(i + 2)
      );
    }
    return diffs === 0;
  }
  // One insertion or deletion: the shorter must be a subsequence of the longer
  // with exactly one skipped character.
  const [shortW, longW] =
    typed.length < target.length ? [typed, target] : [target, typed];
  let i = 0;
  let skipped = 0;
  for (let j = 0; j < longW.length; j++) {
    if (i < shortW.length && shortW[i] === longW[j]) i++;
    else if (++skipped > 1) return false;
  }
  return i === shortW.length;
}

/**
 * Every word that can trigger a command, including the short ones that are too
 * collision-prone to fuzzy-match automatically. Used only to build a
 * SUGGESTION, never to fire a command.
 */
const TRIGGER_WORDS = [
  'dark',
  'light',
  'night',
  'next',
  'previous',
  'spin',
  'spinning',
  'rotate',
  'autorotate',
  'axis',
  'axes',
  'zoom',
  'clip',
  'clipping',
  'orthographic',
  'perspective',
  'projection',
  'describe',
  'collections',
];

/**
 * Words that show the request is about driving the display. A near-miss only
 * becomes a suggestion when one of these is also present, so a bare "taxes" or
 * "darn it" stays silent rather than proposing an action out of nowhere.
 */
const CONTEXT_WORDS = new Set([
  'mode',
  'theme',
  'event',
  'events',
  'collision',
  'detector',
  'scene',
  'view',
  'camera',
  'geometry',
  'in',
  'out',
  'on',
  'off',
  'show',
  'hide',
  'turn',
  'switch',
  'make',
  'display',
  'background',
]);

/** A proposed correction the UI can offer as "did you mean ...?". */
export interface CommandSuggestion {
  /** The command that the corrected request maps to. */
  intent: Intent;
  /** The word as the user typed it. */
  typed: string;
  /** The word it was corrected to. */
  corrected: string;
  /** The full corrected request, for display. */
  text: string;
}

/**
 * Propose (never run) the command a near-miss request probably meant.
 *
 * Typos of short command words cannot be auto-corrected safely, because one
 * edit reaches ordinary English: "darn" is one edit from "dark", "spine" from
 * "spin", "taxes" from "axes". Firing on those would mutate the display on a
 * coincidence. Git solves the same problem the same way: a mistyped subcommand
 * is not executed, it is suggested ("the most similar command is status").
 *
 * So this corrects one word, re-runs the STRICT matcher on the corrected text,
 * and returns what that would have done, for the UI to offer as a confirmable
 * suggestion. Returns null when the request already maps, when no correction
 * helps, or when nothing else in the request suggests the display at all.
 * @param text The user's request.
 * @returns A suggestion, or null.
 */
export function suggestCommand(text: string): CommandSuggestion | null {
  const raw = sanitizeRequest(text).toLowerCase();
  if (!raw) return null;
  // Already understood: there is nothing to suggest.
  if (keywordFallback(raw)) return null;

  const words = raw.split(/[^a-z0-9]+/).filter(Boolean);
  if (!words.length) return null;

  for (let i = 0; i < words.length; i++) {
    const typed = words[i];
    if (TRIGGER_WORDS.includes(typed)) continue; // spelled correctly already
    for (const target of TRIGGER_WORDS) {
      // Relaxed bound (3): a suggestion is offered for confirmation, never
      // executed, so a shorter near-miss like "nex" -> "next" is safe here.
      if (!nearMiss(typed, target, 3)) continue;
      // Require some other word to indicate this is about the display, so an
      // unrelated sentence never produces an out-of-nowhere proposal.
      const hasContext = words.some(
        (w, j) =>
          j !== i && (CONTEXT_WORDS.has(w) || TRIGGER_WORDS.includes(w)),
      );
      if (!hasContext) continue;
      const corrected = [...words.slice(0, i), target, ...words.slice(i + 1)];
      const intent = keywordFallback(corrected.join(' '));
      if (intent) {
        return { intent, typed, corrected: target, text: corrected.join(' ') };
      }
    }
  }
  return null;
}

/** Longest request any natural-language path will read. */
export const MAX_REQUEST_CHARS = 400;

/**
 * Bound a request and strip characters a reader cannot see, preserving case.
 *
 * Every path that reads user text should go through this first. The length
 * bound keeps a huge paste from being tokenised word by word on the main
 * thread; stripping zero-width and Unicode Tag characters stops hidden text
 * from carrying a request the person never saw. Case is preserved because the
 * model reads this text and scene names such as "LAr HEC" are case-sensitive.
 * @param text The raw request.
 * @returns The bounded, cleaned request.
 */
export function sanitizeRequest(text: string): string {
  // Pre-bound before the regexes so their cost is bounded too; a Unicode Tag
  // character is two UTF-16 units, hence the headroom before the real cap.
  return (text ?? '')
    .slice(0, MAX_REQUEST_CHARS * 4)
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g, '')
    .replace(/[\u{E0000}-\u{E007F}]/gu, '')
    .slice(0, MAX_REQUEST_CHARS)
    .trim();
}

/**
 * Live values the matcher cannot know in advance, because they differ per
 * experiment: ATLAS, LHCb and CMS have different preset views and different
 * geometry part names. Supplying them lets the deterministic path handle
 * "go to the left view" and "hide the beam" WITHOUT a model, which is the only
 * path available to a student whose browser has no WebGPU.
 */
export interface LiveNames {
  /** Names of the preset camera views currently configured. */
  presetViews?: readonly string[];
  /** Names of the geometry parts currently in the scene. */
  geometryParts?: readonly string[];
}

/**
 * Map a request to a command using deterministic keyword matching, with no
 * model involved.
 *
 * This is the path a browser without WebGPU always takes, and the fast path
 * even when a model is loaded, so it must never guess: it either recognises
 * the request or returns null and lets the caller decide what to do.
 * @param text The user's request.
 * @param live Per-experiment names (preset views, geometry parts) the matcher
 * cannot know in advance, so requests naming them can be handled without a model.
 * @returns The matched command and arguments, or null when nothing matched.
 */
export function keywordFallback(text: string, live?: LiveNames): Intent | null {
  // Bound the input and strip invisible characters before matching. A command
  // request is a short sentence; a huge paste would otherwise be tokenised and
  // scanned word by word, and hidden characters (zero-width, Unicode Tags)
  // must never carry text a reader cannot see.
  const t = sanitizeRequest(text).toLowerCase();
  if (!t) return null;

  // Tokenize into words and match on WHOLE words / word-stems, not raw
  // substrings. Naive `includes` caused command confusion: "highlight" contains
  // "light" (would flip the theme), "context" contains "next", "spine" contains
  // "spin", "taxes" contains "axes", "eclipse" contains "clip", "offset"
  // contains "off". Whole-word matching removes that entire class of bug.
  const words = t.split(/[^a-z0-9]+/).filter(Boolean);
  const wordSet = new Set(words);
  /**
   * True if any of `ws` appears as a whole word, allowing ONE typo in longer
   * words (students mistype constantly: "drak mode", "spinn the detector",
   * "show the axies"). The edit budget is deliberately tiny and only applies
   * from 5 characters up, so short command words stay exact and unrelated
   * words ("taxes", "spine", "next door") can never become commands.
   */
  const hasWord = (...ws: string[]) =>
    ws.some(
      (w) =>
        wordSet.has(w) ||
        (TYPO_SAFE.has(w) && words.some((q) => nearMiss(q, w))),
    );
  /** True if any word starts with one of `stems` (e.g. "clip" -> clipping). */
  const hasStem = (...stems: string[]) =>
    stems.some(
      (s) =>
        words.some((w) => w.startsWith(s)) ||
        (TYPO_SAFE.has(s) && words.some((q) => nearMiss(q, s))),
    );
  /** True if any multi-word phrase appears verbatim. */
  const hasPhrase = (...ps: string[]) => ps.some((p) => t.includes(p));

  const negated =
    hasWord(
      'stop',
      'disable',
      'hide',
      'remove',
      'off',
      'without',
      'no',
      'not',
    ) || hasPhrase("don't", 'turn off', 'switch off');

  const aboutEvents = hasWord('event', 'events');
  if (hasWord('next') && (aboutEvents || !hasStem('view', 'perspective')))
    return { command: 'next-event', args: {} };
  if (aboutEvents && hasPhrase('go forward', 'forward one', 'after this'))
    return { command: 'next-event', args: {} };
  if (
    hasWord('previous', 'prev') ||
    hasPhrase('last event', 'event before') ||
    // "go back" is only event navigation when events are the subject:
    // "go back to perspective" is a camera request.
    (aboutEvents && hasPhrase('go back'))
  )
    return { command: 'previous-event', args: {} };

  // Theme words are matched as whole words (plus the few real inflections),
  // never as prefixes: "lightning" and "darkness" start with the trigger but
  // are not theme requests, and a command must not fire on a coincidence.
  // Negation flips the target: "turn off dark mode" asks for the LIGHT theme.
  // Without this the phrase reached set-theme and set dark ON, which is the
  // opposite of what was asked.
  if (hasWord('dark', 'darker', 'night'))
    return { command: 'set-theme', args: { dark: !negated } };
  if (hasWord('light', 'lighter', 'lightmode', 'day'))
    return { command: 'set-theme', args: { dark: negated } };

  // A named preset view is a one-off camera move. This has to be settled
  // BEFORE auto-rotate, because "rotate to the transverse view" contains a
  // rotate stem but is not a request to spin.
  //
  // The matcher cannot invent preset names (they differ per experiment), so it
  // only does this when the caller passes the live ones. Without them it
  // honestly declines rather than guessing a view that may not exist. Before
  // this, a student without WebGPU had no way to reach a preset view by
  // asking, since only the model path knew the names.
  const presetViews = live?.presetViews;
  if (presetViews?.length && /\b(view|views)\b/.test(t)) {
    const wantsMove =
      /\b(go|goto|snap|jump|switch|move|rotate|rotates|rotating|show|take|look|set)\b/.test(
        t,
      ) || /\bto\s+the\b/.test(t);
    if (wantsMove) {
      const words = new Set(t.match(/[a-z0-9]+/g) ?? []);
      // Match on the distinctive words of the preset name ("Left"/"Transverse"),
      // ignoring the shared word "view" which every preset carries.
      let best: string | null = null;
      let bestScore = 0;
      for (const name of presetViews) {
        const parts = (name.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter(
          (w) => w !== 'view' && w !== 'views',
        );
        if (!parts.length) continue;
        const hits = parts.filter(
          (part) =>
            words.has(part) ||
            // "centre" and "center" are the same view.
            (part === 'center' && words.has('centre')) ||
            (part === 'centre' && words.has('center')),
        ).length;
        if (hits === parts.length && hits > bestScore) {
          bestScore = hits;
          best = name;
        }
      }
      if (best) return { command: 'preset-view', args: { view: best } };
      // A view was clearly asked for but named something we do not have.
      // Guessing a different one would move the camera somewhere the student
      // did not ask for, so say nothing.
      if (/\b(to|towards|into)\b/.test(t)) return null;
    }
  }

  // Auto-rotate = continuous spin. An explicit "spin"/"auto-rotate" always wins.
  // The BARE stem "rotate", though, collided with "rotate to the <X> view",
  // which is a one-off camera move (preset-view) and mis-fired auto-rotate in
  // the wild. So for bare "rotate" only, exclude the "...to a view" phrasing;
  // the model path maps that to preset-view. A pure fallback cannot know the
  // live preset names, so it honestly returns no-match rather than guess one.
  const explicitSpin =
    hasWord('spin', 'spins', 'spinning', 'autorotate') ||
    (hasWord('auto') && hasStem('rotat'));
  const rotateToView =
    /\brotat\w*\s+(to|towards|into)\b/.test(t) ||
    (hasStem('rotat') && hasWord('view', 'views'));
  if (explicitSpin || (hasStem('rotat') && !rotateToView))
    return { command: 'toggle-auto-rotate', args: { on: !negated } };

  if (hasWord('axis', 'axes'))
    return { command: 'show-axis', args: { show: !negated } };

  if (hasWord('zoom', 'zooming')) {
    if (hasWord('in', 'closer', 'nearer'))
      return { command: 'zoom', args: { direction: 'in' } };
    if (hasWord('out', 'away', 'further'))
      return { command: 'zoom', args: { direction: 'out' } };
  }
  // Students say "get closer" and "move back" far more often than "zoom".
  // Only the unambiguous distance words, so this cannot swallow other requests.
  if (hasWord('closer', 'nearer'))
    return { command: 'zoom', args: { direction: 'in' } };
  if (hasPhrase('further away', 'move back', 'back off', 'zoom back'))
    return { command: 'zoom', args: { direction: 'out' } };

  if (hasStem('projection', 'orthographic', 'perspective')) {
    // A stated target is idempotent: asking for orthographic twice leaves you
    // orthographic. Only a bare "toggle the projection" flips.
    if (hasStem('orthographic', 'ortho'))
      return {
        command: 'toggle-camera-projection',
        args: { orthographic: true },
      };
    if (hasStem('perspective'))
      return {
        command: 'toggle-camera-projection',
        args: { orthographic: false },
      };
    return { command: 'toggle-camera-projection', args: {} };
  }

  if (hasStem('clip') || hasPhrase('look inside', 'see inside', 'cut away'))
    return { command: 'set-clipping', args: { on: !negated } };

  // A named geometry part. Placed after the specific toggles above so that
  // "hide the axes" stays the axis command, and only matched against the parts
  // actually present, since inventing one would silently do nothing.
  const geometryParts = live?.geometryParts;
  if (geometryParts?.length && hasStem('hide', 'show', 'display', 'reveal')) {
    // The command acts on ONE part. "Hide everything except the pixel" or "show
    // the pixel and hide the beam" cannot be honoured by it, and acting on the
    // one part named does the opposite of what was asked, so decline instead.
    const excludes =
      /\b(except|apart from|other than|all but|everything but|but not)\b/.test(
        t,
      );
    const bothWays = hasStem('hide') && hasStem('show', 'display', 'reveal');
    if (excludes || bothWays) return null;
    const words = t.match(/[a-z0-9]+/g) ?? [];
    const joined = ' ' + words.join(' ') + ' ';
    let best: string | null = null;
    let bestLength = 0;
    for (const part of geometryParts) {
      const parts = part.toLowerCase().match(/[a-z0-9]+/g) ?? [];
      if (!parts.length) continue;
      // Whole-word phrase match, so "beam" does not match "beampipe" and a
      // longer, more specific name wins over a shorter one it contains.
      if (
        joined.includes(' ' + parts.join(' ') + ' ') &&
        parts.length >= bestLength
      ) {
        bestLength = parts.length;
        best = part;
      }
    }
    if (best) {
      return {
        command: 'set-geometry-visibility',
        args: { part: best, visible: !hasStem('hide') && !negated },
      };
    }
  }

  // Data queries (safe, read-only): describe the event, list its collections.
  if (hasStem('describe') || hasPhrase('about this event', 'about the event'))
    return { command: 'describe-event', args: {} };
  if (hasWord('collections') || hasPhrase('list collections'))
    return { command: 'list-collections', args: {} };

  return null;
}
