/**
 * Phoenix knowledge base for the natural-language "Ask" tutor (#942, Phase D).
 *
 * A curated set of VETTED answers (grounded in the Phoenix user guide and
 * standard high-energy-physics definitions) plus deterministic retrieval. The
 * tutor returns this vetted text; it never free-generates physics, so it cannot
 * teach a student something wrong (the hard constraint for masterclass use).
 * It needs no model and no WebGPU: it works on any device. When nothing matches
 * well it returns null, and the caller says so honestly rather than guessing.
 *
 * Content is experiment-agnostic where possible; ATLAS/CMS/LHCb-specific facts
 * are labelled as such.
 */

/** One vetted knowledge entry. */
export interface KnowledgeEntry {
  /** Unique slug. */
  id: string;
  /** Human-readable title shown above the answer. */
  title: string;
  /** Query terms that should retrieve this entry (curated, distinctive). */
  aliases: string[];
  /** The vetted answer to "what is this?" (plain text, kept short). */
  body: string;
  /**
   * Vetted steps answering "how do I use this?". Every step must describe the
   * REAL Phoenix UI; where Phoenix cannot do something, say so rather than
   * inventing a control.
   */
  howto?: string;
  /** Why this matters / what it is for ("why do we use eta?"). */
  why?: string;
  /** Where to find it in the interface ("where is the kinematics panel?"). */
  where?: string;
  /** Ids of related entries a student might ask next. */
  related?: string[];
  /**
   * An optional action this concept maps to, so the answer can offer to DO the
   * thing. MUST reference a registered command (validated in tests).
   */
  action?: { command: string; args?: Record<string, any>; label: string };
  /** Grouping tag. */
  tags?: ('phoenix' | 'physics' | 'data' | 'detector' | 'hsf')[];
}

/** Words ignored when scoring a query against entries. */
const STOP = new Set([
  'a',
  'an',
  'the',
  'is',
  'are',
  'was',
  'were',
  'do',
  'does',
  'did',
  'what',
  'whats',
  'which',
  'who',
  'why',
  'how',
  'when',
  'where',
  'to',
  'of',
  'in',
  'on',
  'for',
  'and',
  'or',
  'me',
  'my',
  'this',
  'that',
  'these',
  'those',
  'it',
  'its',
  'about',
  'tell',
  'explain',
  'define',
  'meaning',
  'mean',
  'i',
  'you',
  'can',
  'please',
  'show',
  'thing',
  'stuff',
  'use',
  'using',
  'work',
  'works',
  'get',
  'understand',
  'know',
  'point',
  'purpose',
  // Conversational filler: these carry no topic meaning, and counting them as
  // content words wrongly dilutes how much of a question a match explains.
  'am',
  'at',
  'be',
  'been',
  'looking',
  'look',
  'want',
  'need',
  'would',
  'could',
  'should',
  'will',
  'just',
  'now',
  'here',
  'there',
  'some',
  'any',
  'all',
  'with',
  'from',
  'into',
  'have',
  'has',
  'had',
  'make',
  'made',
  'go',
  'going',
  'again',
  'also',
  'very',
  'really',
  'actually',
  'thanks',
  'thank',
  'hey',
  'ok',
  // Negated-comprehension filler: "i dont understand X" is about X alone.
  'dont',
  'doesnt',
  'cant',
  'not',
  'no',
  'never',
  'quite',
  'sure',
  'okay',
  'lets',
  'let',
  'us',
  'we',
  'they',
  'them',
  'so',
  'if',
  'then',
  'than',
  'as',
  'by',
  'up',
  'down',
  'out',
  'over',
  'more',
  'most',
  'much',
  'many',
]);

/**
 * Longest request we will process. A real question is a sentence; anything
 * beyond this is a paste or an attack, and fuzzy-matching it word-by-word
 * against every alias would block the main thread for minutes (measured: a
 * 400k-character input took ~116 s before this cap). Truncating keeps the tab
 * responsive and still matches on the meaningful beginning of the text.
 */
const MAX_QUERY_CHARS = 400;

/**
 * Lowercase, treat -/_/ as spaces so "eta-phi" == "eta phi", strip invisible
 * characters (zero-width joiners and the Unicode Tags block can hide text that
 * a reader cannot see), and bound the length.
 */
function normalize(text: string): string {
  return (text ?? '')
    .slice(0, MAX_QUERY_CHARS)
    .toLowerCase()
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g, '')
    .replace(/[\u{E0000}-\u{E007F}]/gu, '')
    .replace(/[-_/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Cache of tokenised strings. Aliases and titles are static, so re-tokenising
 * them on every lookup (once per alias, twice counting the coverage gate) was
 * the dominant cost of a search. Queries are bounded and repeat often too.
 */
const tokenCache = new Map<string, string[]>();

/** Single letters that name a particle or a quark flavour. */
const PARTICLE_LETTERS = new Set(['z', 'w', 'b', 't', 'c', 'k']);

/**
 * Nouns that name the KIND of thing rather than WHICH thing. They appear in
 * questions about every topic ("a dimuon event", "a Higgs event") so they
 * cannot tell two topics apart, and counting them when measuring how much of a
 * question an entry explains would wrongly penalise a correct match.
 */
const GENERIC_CONTAINER = new Set(['event', 'events']);

/**
 * Content tokens of a phrase: meaningful words, with stopwords and single
 * characters dropped. A few single letters are kept because in this domain
 * they are names rather than noise ("z boson" must not collapse to "boson",
 * and "b quark" must not collapse to "quark").
 */
export function contentTokens(text: string): string[] {
  // Every alias and every real question is short, so it is its own key and the
  // hot path does no extra normalising. Only an oversized paste is reduced to
  // its bounded form first: keying on the raw string stored each distinct huge
  // paste in full (300 pastes of 200 KB grew the heap from 33 MB to 88 MB).
  const key = text && text.length > MAX_QUERY_CHARS ? normalize(text) : text;
  const hit = tokenCache.get(key);
  if (hit) return hit;
  const tokens = (normalize(key).match(/[a-z0-9]+/g) ?? []).filter(
    // Single letters are normally noise, but in particle physics they ARE
    // names: the Z and W bosons, and the b/t/c quark flavours ("b quark",
    // "b jet", "k meson"). Keeping them lets those aliases stay two-token
    // and distinctive instead of collapsing onto the generic word.
    (w) => !STOP.has(w) && (w.length > 1 || PARTICLE_LETTERS.has(w)),
  );
  // Bound the cache so a stream of distinct queries cannot grow it without
  // limit; the static aliases are what matter and they are inserted first.
  if (tokenCache.size < 5000) tokenCache.set(key, tokens);
  return tokens;
}

/**
 * Bounded Optimal String Alignment (restricted Damerau-Levenshtein) distance:
 * counts insertions, deletions, substitutions AND adjacent transpositions,
 * each as one edit. Transpositions ("altas" -> "atlas", "teh" -> "the") are
 * among the most common human typos, so treating them as a single edit is what
 * makes short-word typo tolerance work. Returns `max + 1` as soon as the
 * distance is known to exceed `max`, for cheap early rejection.
 * @param a The first word.
 * @param b The second word.
 * @param max The largest distance worth computing exactly.
 * @returns The edit distance, or `max + 1` once it is known to exceed `max`.
 */
function editDistance(a: string, b: string, max: number): number {
  const al = a.length;
  const bl = b.length;
  if (Math.abs(al - bl) > max) return max + 1;
  if (edRow0.length < bl + 1) {
    edRow0 = new Array(bl + 1);
    edRow1 = new Array(bl + 1);
    edRow2 = new Array(bl + 1);
  }
  let prevPrev: number[] = edRow0;
  let prev: number[] = edRow1;
  let curr: number[] = edRow2;
  for (let j = 0; j <= bl; j++) {
    prevPrev[j] = 0;
    prev[j] = j;
  }
  for (let i = 1; i <= al; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= bl; j++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      let v = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      if (
        i > 1 &&
        j > 1 &&
        a.charCodeAt(i - 1) === b.charCodeAt(j - 2) &&
        a.charCodeAt(i - 2) === b.charCodeAt(j - 1)
      ) {
        v = Math.min(v, prevPrev[j - 2] + 1); // adjacent transposition
      }
      curr[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    const tmp = prevPrev;
    prevPrev = prev;
    prev = curr;
    curr = tmp;
  }
  return prev[bl];
}

/** Cache of trigram sets: the same alias words are compared constantly. */
const trigramCache = new Map<string, Set<string>>();

/** Character trigrams of a word (padded), for scramble-tolerant similarity. */
function trigrams(w: string): Set<string> {
  const hit = trigramCache.get(w);
  if (hit) return hit;
  const s = `  ${w} `;
  const out = new Set<string>();
  for (let i = 0; i < s.length - 2; i++) out.add(s.slice(i, i + 3));
  if (trigramCache.size < 5000) trigramCache.set(w, out);
  return out;
}

/**
 * Dice similarity (0..1) of two words' trigram sets, but only computed when it
 * could possibly reach `bar`; otherwise 0.
 *
 * This is the fallback path, so it runs for nearly every NON-matching pair,
 * which is the overwhelming majority of comparisons in a question. Two exact
 * short-circuits make that cheap without changing any answer: the overlap can
 * never exceed the smaller set, so a pair whose sets differ enough in size
 * cannot reach the bar at all; and once too many of the smaller set's trigrams
 * have been missed, the rest cannot make the bar up either.
 */
function trigramSimilarity(a: string, b: string, bar: number): number {
  if (a === b) return 1;
  const ta = trigrams(a);
  const tb = trigrams(b);
  const total = ta.size + tb.size;
  const needed = (bar * total) / 2;
  // Best case every trigram of the smaller set is shared.
  if (Math.min(ta.size, tb.size) < needed) return 0;
  const [small, large] = ta.size <= tb.size ? [ta, tb] : [tb, ta];
  let inter = 0;
  let remaining = small.size;
  for (const g of small) {
    if (large.has(g)) inter++;
    remaining--;
    if (inter + remaining < needed) return 0;
  }
  return (2 * inter) / total;
}

/**
 * Scratch rows for {@link editDistance}, reused across calls. A single question
 * runs it thousands of times (every query word against every distinct alias
 * word), and allocating three rows per call made garbage collection, not the
 * algorithm, the dominant cost of answering. JavaScript here is single-threaded
 * and that function does not recurse, so one set of buffers is safe.
 */
let edRow0: number[] = [];
/** Second scratch row for {@link editDistance}; see edRow0. */
let edRow1: number[] = [];
/** Third scratch row for {@link editDistance}; see edRow0. */
let edRow2: number[] = [];

/** Memoised {@link fuzzyTokenScore} results, keyed by the token pair. */
const fuzzyScoreCache = new Map<string, number>();

/**
 * Typo-tolerant match strength (0..1) between a query token and an alias token.
 * Exact is 1; near-misses score by how close they are. Thresholds are
 * length-aware so short words need near-exact matches (avoiding "eta"~"ate")
 * while longer words tolerate a couple of typos ("calorimter"~"calorimeter").
 * @param qtok A token from the user's query.
 * @param atok A token from a curated alias.
 * @returns Match strength, 0 when they are not close enough.
 */
function fuzzyTokenScore(qtok: string, atok: string): number {
  if (qtok === atok) return 1;
  // The same token pair is compared many times within a single question: alias
  // words repeat across entries ("track" appears in a dozen of them), and the
  // index scan compares every query word against every distinct alias word.
  // The comparison is a pure function of the two strings, so caching it is
  // exact, and it is the difference between rescoring a growing knowledge base
  // on every question and doing the real work once.
  const key = `${qtok}\u0000${atok}`;
  const memo = fuzzyScoreCache.get(key);
  if (memo !== undefined) return memo;
  const result = computeFuzzyTokenScore(qtok, atok);
  // Alias tokens are a fixed set and query tokens are bounded per question, so
  // this converges; the cap only guards against a long adversarial session.
  if (fuzzyScoreCache.size < 20000) fuzzyScoreCache.set(key, result);
  return result;
}

/**
 * Uncached body of {@link fuzzyTokenScore}.
 * @param qtok A token from the user's query.
 * @param atok A token from a curated alias.
 * @returns Match strength, 0 when they are not close enough.
 */
function computeFuzzyTokenScore(qtok: string, atok: string): number {
  const minLen = Math.min(qtok.length, atok.length);
  // A genuine prefix is a strong, safe signal ("cel" ~ "cell", "calo" ~
  // "calorimeter"), but only when the words are close in length: otherwise a
  // short prefix of a long word creates false matches ("photo" would otherwise
  // match "photosynthesis" via "photograph").
  if (minLen >= 3 && (qtok.startsWith(atok) || atok.startsWith(qtok))) {
    const maxLen = Math.max(qtok.length, atok.length);
    if (maxLen - minLen <= 4) return 0.85;
  }
  // Edit-distance fuzzing of very short words is unsafe ("eta"~"beta",
  // "jet"~"get"), so require BOTH tokens be >= 4 chars for a non-prefix
  // near-match. This also stops a stray letter from matching a long alias.
  if (minLen < 4) return 0;
  const len = Math.max(qtok.length, atok.length);
  const maxEdits = len <= 5 ? 1 : len <= 9 ? 2 : 3;
  const d = editDistance(qtok, atok, maxEdits);
  if (d <= maxEdits) return 1 - (d - 0.5) / (len + 1);
  // Trigram fallback catches transpositions/scrambles edit distance misses.
  const sim = trigramSimilarity(qtok, atok, 0.55);
  return sim >= 0.55 ? sim * 0.8 : 0;
}

/** Best fuzzy score of `atok` against any of the query tokens. */
function bestTokenScore(atok: string, qTokens: string[]): number {
  let best = 0;
  for (const q of qTokens) {
    const s = fuzzyTokenScore(q, atok);
    if (s > best) best = s;
    if (best === 1) break;
  }
  return best;
}

/**
 * Whether a request is a concept/help QUESTION (route to the knowledge base)
 * rather than an action to perform. Covers definitional ("what is X", "what's
 * X", "define X"), how-to ("how do I use X", "how does X work"), and explain
 * ("explain X", "tell me about X", "I don't get X") phrasings, plus a trailing
 * "?" or a bare topic. It returns false ONLY when the request clearly points at
 * the LIVE event data ("this event", "the current collision"), which is an
 * action (describe-event) rather than a glossary lookup. Typo-tolerant on the
 * question words so "waht is" / "wat is" still route to the tutor.
 * @param text The user's request.
 * @returns True when the tutor should answer from the knowledge base.
 */
export function isConceptQuestion(text: string): boolean {
  const raw = (text ?? '').toLowerCase();
  const t = normalize(text);
  if (!t) return false;
  // Only a reference to the live DATA is an action, not a glossary lookup.
  // "this event/collision/data" -> command; "this eta-phi panel" -> question.
  if (
    /\b(this|these|current|the current)\s+(event|events|collision|collisions|data)\b/.test(
      raw,
    )
  ) {
    return false;
  }
  return hasDefinitionalPhrasing(text) || /\?\s*$/.test(raw);
}

/**
 * Whether a request is WORDED as a question, ignoring punctuation.
 *
 * A trailing question mark is weak evidence: "next event?" is an instruction
 * asked politely, not a request for a definition. Interrogative wording is
 * strong evidence. Separating the two lets a caller that owns both the tutor
 * and the command matcher decide which should win, without this module (which
 * is deliberately UI- and command-agnostic) needing to know commands exist.
 * @param text The user's request.
 * @returns True when the phrasing itself asks for an explanation.
 */
export function hasDefinitionalPhrasing(text: string): boolean {
  const raw = (text ?? '').toLowerCase();
  const t = normalize(text);
  if (!t) return false;
  if (
    /\b(this|these|current|the current)\s+(event|events|collision|collisions|data)\b/.test(
      raw,
    )
  ) {
    return false;
  }
  const definitional =
    /\b(what|whats|whatis|wat|waht|wht)\b.*\b(is|are|s|means?|does)\b/.test(
      t,
    ) ||
    /\b(what|whats)\b/.test(t) ||
    /\b(define|definition|meaning|explain|explanation|describe)\b/.test(t) ||
    /\b(tell|teach|show)\b.*\babout\b/.test(t) ||
    /\bhow\b.*\b(work|works|use|used|do i|does|to|can i)\b/.test(t) ||
    /\b(dont|don t|do not|cant|can t)\b.*\b(understand|get|know)\b/.test(t) ||
    /\b(difference|compare|versus|vs)\b/.test(t) ||
    /\b(purpose|point|use)\s+of\b/.test(t) ||
    // "why ..." always asks for an explanation, never an action.
    /\bwhy\b/.test(t) ||
    // "where is/are ..." asks where to find something in the interface.
    /\bwhere\b/.test(t);
  return definitional;
}

/** The kind of question a student asked about a topic. */
export type QuestionIntent =
  | 'definition'
  | 'howto'
  | 'why'
  | 'where'
  | 'compare'
  | 'meta';

/**
 * Classify WHAT KIND of question was asked, so the tutor can answer the right
 * facet of a topic. "what is the kinematics panel" and "how do I use the
 * kinematics panel" are the same topic but different questions.
 * @param text The user's request.
 * @returns The question intent (defaults to a definition).
 */
export function detectQuestionIntent(text: string): QuestionIntent {
  const t = normalize(text);
  if (!t) return 'definition';
  // Meta: asking about the assistant itself rather than a physics/UI topic.
  if (
    /\b(what can (i|you)|what do you (do|know)|who are you|help me|^help$|what are you)\b/.test(
      t,
    ) ||
    t === 'help'
  ) {
    return 'meta';
  }
  if (/\b(difference|differences|compare|versus|vs)\b/.test(t))
    return 'compare';
  if (/\bwhere\b/.test(t)) return 'where';
  // "why" and "what is the point/use of X" ask for purpose.
  if (/\bwhy\b/.test(t) || /\b(point|purpose|use)\s+of\b/.test(t)) return 'why';
  // How-to: "how do/can I ...", "how to ...", "how does X work".
  if (/\bhow\b/.test(t)) return 'howto';
  return 'definition';
}

/** A chosen facet of an entry, and whether it was the one asked for. */
export interface SelectedFacet {
  /** The text to show. */
  text: string;
  /** True when the entry actually had the requested facet. */
  requested: boolean;
}

/**
 * Pick the text answering the asked-for facet, falling back to the definition
 * when that facet was never written (flagged, so the caller can be honest
 * rather than pretend the definition was a set of steps).
 * @param entry The matched knowledge entry.
 * @param intent The kind of question asked.
 * @returns The chosen text and whether it was the requested facet.
 */
export function selectFacet(
  entry: KnowledgeEntry,
  intent: QuestionIntent,
): SelectedFacet {
  const facet =
    intent === 'howto'
      ? entry.howto
      : intent === 'why'
        ? entry.why
        : intent === 'where'
          ? entry.where
          : undefined;
  if (facet) return { text: facet, requested: true };
  return { text: entry.body, requested: intent === 'definition' };
}

/**
 * Minimum score for a query to count as a real match. Below this the tutor says
 * it does not know, which is always better than a confidently wrong answer.
 */
const MATCH_THRESHOLD = 2.4;

/**
 * Similarity a ONE-WORD question must reach for the tutor to answer. Measured:
 * at this bar the false-answer rate over a 260-query out-of-scope corpus is
 * zero; relaxing it to 0.78 raises recall by ~1 point but starts answering
 * questions the knowledge base has no answer for, which is the wrong trade.
 */
const STRICT_SINGLE_WORD = 0.82;

/**
 * The lower bar used only to OFFER a topic ("did you mean ...?"). A suggestion
 * is confirmed by the student, so it can be more generous without ever
 * producing a wrong answer.
 */
const RELAXED_SINGLE_WORD = 0.7;

/**
 * Retrieve the best-matching knowledge entry for a query, or null when nothing
 * matches well enough (an honest "I don't know" beats a wrong answer). Matching
 * is typo- and phrasing-tolerant: each curated alias is scored by fuzzy token
 * matching (bounded edit distance + trigram similarity), so "calorimter",
 * "eta phee", "phnix" and re-orderings still resolve. A multi-word alias whose
 * words are all present scores highest; a distinctive single-word alias next.
 * @param text The user's request.
 * @param kb The knowledge base (defaults to the built-in one).
 * @returns The best entry, or null.
 */
/**
 * Alias-token index for a knowledge base: every distinct token appearing in any
 * alias, mapped to the entries that use it.
 *
 * Scoring every entry against every query is O(entries x aliases x words), and
 * the base grows as Phoenix does, so that cost is paid on every keystroke-free
 * question forever. Both scoring branches require at least one alias token to
 * reach the 0.7 fuzzy bar, so any entry without such a token cannot score above
 * zero and need never be examined. The index turns the scan into "which few
 * entries share a near-matching token", which is what keeps answering a
 * question inside a single frame as topics are added.
 */
interface AliasIndex {
  /** Every distinct content token that appears in any alias. */
  tokens: string[];
  /** For each token (same position), the indices of entries that use it. */
  owners: number[][];
  /**
   * Memo of "which entries could this query word reach". Comparing one word
   * against every distinct alias word is the single most expensive thing a
   * question does (measured: ~4,500 fuzzy comparisons for a six-word question,
   * dwarfing the ~70 alias scans the actual scoring performs). The alias
   * vocabulary is fixed, so the answer for a given word never changes, and
   * students reuse words heavily across questions.
   */
  reach: Map<string, number[]>;
}

/** Indexes are keyed by the base itself, so curated and merged bases differ. */
const aliasIndexCache = new WeakMap<KnowledgeEntry[], AliasIndex>();

/**
 * Build (or reuse) the alias-token index for a knowledge base.
 * @param kb The knowledge base to index.
 * @returns The index, cached per base so it is built once.
 */
function aliasIndex(kb: KnowledgeEntry[]): AliasIndex {
  const cached = aliasIndexCache.get(kb);
  if (cached) return cached;
  const byToken = new Map<string, number[]>();
  kb.forEach((entry, i) => {
    for (const alias of entry.aliases) {
      for (const token of contentTokens(alias)) {
        const owners = byToken.get(token);
        if (owners) {
          if (owners[owners.length - 1] !== i) owners.push(i);
        } else {
          byToken.set(token, [i]);
        }
      }
    }
  });
  const index: AliasIndex = {
    tokens: [...byToken.keys()],
    owners: [...byToken.values()],
    reach: new Map(),
  };
  aliasIndexCache.set(kb, index);
  return index;
}

/** Entries that share a near-matching alias token with the query. */
function candidateEntries(
  kb: KnowledgeEntry[],
  qContent: string[],
): KnowledgeEntry[] {
  const { tokens, owners, reach } = aliasIndex(kb);
  const hits = new Set<number>();
  for (const qt of qContent) {
    let reachable = reach.get(qt);
    if (reachable === undefined) {
      const found = new Set<number>();
      for (let t = 0; t < tokens.length; t++) {
        if (fuzzyTokenScore(qt, tokens[t]) >= 0.7) {
          for (const owner of owners[t]) found.add(owner);
        }
      }
      reachable = [...found];
      // Bounded so a long adversarial session cannot grow it without limit.
      if (reach.size < 5000) reach.set(qt, reachable);
    }
    for (const owner of reachable) hits.add(owner);
  }
  const out: KnowledgeEntry[] = [];
  for (const i of hits) out.push(kb[i]);
  return out;
}

/**
 * Find the single knowledge entry that best answers a question, or nothing.
 *
 * Retrieval is deterministic and typo tolerant, and deliberately answers
 * NOTHING when no entry explains enough of what was asked: for a tutor aimed
 * at students, silence is always better than a confident wrong answer.
 * @param text The student's question.
 * @param kb The knowledge base to search (curated plus derived entries).
 * @param singleWordBar Similarity a one-word question must reach, since
 * coverage cannot discriminate when the question is a single word.
 * @param matchThreshold Score a match must reach to be answered at all.
 * @returns The best entry, or null when nothing is a believable match.
 */
export function findKnowledge(
  text: string,
  kb: KnowledgeEntry[] = KNOWLEDGE_BASE,
  singleWordBar: number = STRICT_SINGLE_WORD,
  matchThreshold: number = MATCH_THRESHOLD,
): KnowledgeEntry | null {
  const q = normalize(text);
  if (!q) return null;
  // A genuine question is a sentence. Comparing 60+ words from a paste against
  // every alias multiplies work without improving the match.
  const qContent = contentTokens(text).slice(0, 12);
  if (!qContent.length) return null;

  // When the student asks HOW to do something, prefer an entry that actually
  // has procedural steps over a pure definition of the same topic, so
  // "how do I measure the invariant mass" reaches the recipe, not the concept.
  const intent = detectQuestionIntent(text);

  let best: KnowledgeEntry | null = null;
  let bestScore = 0;
  for (const entry of candidateEntries(kb, qContent)) {
    // Score by the entry's BEST single-word alias and BEST phrase alias, not
    // the sum over all aliases: otherwise an entry that lists many synonyms
    // (event / events / collision) would out-score a more specific match
    // (dimuon) purely by having more aliases.
    let bestSingle = 0;
    let bestPhrase = 0;
    for (const alias of entry.aliases) {
      // Match only the CONTENT words of an alias against the content words of
      // the query, so generic words ("what", "is", "the", "a") in either the
      // alias or the query can never create a false match.
      const words = contentTokens(alias);
      if (words.length === 0) continue;
      if (words.length === 1) {
        const a = words[0];
        const s = bestTokenScore(a, qContent);
        if (s >= 0.7) {
          const weight = a.length >= 6 ? 4 : 3;
          // An EXACT alias match must beat a fuzzy/prefix match on a different
          // entry ("calo" == calorimeter's alias should win over "calo" ~
          // "calocell"), so give exact hits a decisive bonus.
          //
          // A FUZZY single-word match, though, is weak evidence: "relativity"
          // is close enough to "geneva" and "neutron" to "neutrino" that one
          // near-miss must never be enough to answer on its own. Fuzzy hits are
          // damped below the answer threshold, so they can only contribute
          // alongside other corroborating matches. This is what keeps the tutor
          // from confidently answering questions it has no entry for.
          const contribution = s === 1 ? weight + 1.5 : weight * s;
          bestSingle = Math.max(bestSingle, contribution);
        }
      } else {
        // Multi-word phrase: reward when its words are (fuzzily) present. Full
        // presence of a distinctive phrase is the strongest signal.
        let matched = 0;
        let sum = 0;
        for (const w of words) {
          const s = bestTokenScore(w, qContent);
          if (s >= 0.7) matched++;
          sum += s;
        }
        // A phrase can never be "present" in a query that has fewer content
        // words than the phrase: otherwise a single token ("lhc") appears to
        // satisfy a two-word alias ("lhc status") and every alias mentioning a
        // topic outranks the entry that IS the topic.
        const coverable = qContent.length >= words.length;
        if (coverable && matched === words.length) {
          bestPhrase = Math.max(bestPhrase, 5 + words.length + sum);
        } else if (coverable && matched >= 2) {
          bestPhrase = Math.max(bestPhrase, 2 + sum);
        }
      }
    }
    let score = bestSingle + bestPhrase;

    // COVERAGE GATE. A match is only believable if it explains a real share of
    // what the student actually typed. Without this, one near-miss word answers
    // a question that has nothing to do with the entry ("what is a laser" fuzzy
    // matched "zoom"; "general relativity" matched "geneva"). Coverage counts
    // how many of the query's content words the entry accounts for, so a typo
    // of the whole topic ("calorimter") still scores 1.0 while an unrelated
    // question with one coincidental near-miss scores far below the bar.
    if (score > 0) {
      let matchedQueryWords = 0;
      let matchedDistinctive = 0;
      let distinctiveWords = 0;
      for (const qt of qContent) {
        const generic = GENERIC_CONTAINER.has(qt);
        if (!generic) distinctiveWords++;
        const matched = entry.aliases.some((alias) =>
          contentTokens(alias).some((aw) => fuzzyTokenScore(qt, aw) >= 0.7),
        );
        if (matched) {
          matchedQueryWords++;
          if (!generic) matchedDistinctive++;
        }
      }
      // "Event" is the universal container noun here: ANY object question can
      // be phrased as "a <topic> event" (a dimuon event, a Higgs event), so it
      // carries no discriminating information and must not count against a
      // match the way a distinctive noun does. "Star" in "neutron star" and
      // "panel" in "histogram panel" DO discriminate (they name a different
      // object), so they stay in the denominator and those stay rejected.
      const coverage = distinctiveWords
        ? matchedDistinctive / distinctiveWords
        : matchedQueryWords / qContent.length;
      // A real match explains MOST of the question. Half is not enough:
      // "magnetic monopole" half-matches "magnetic field" and "neutron star"
      // half-matches "neutrino", and answering those would be inventing.
      // Longer questions are allowed a little more slack, since they carry
      // extra descriptive words the aliases will not contain.
      const minCoverage = qContent.length >= 4 ? 0.5 : 0.66;
      if (coverage < minCoverage) score = 0;
      else score *= 0.6 + 0.4 * coverage;

      // A ONE-WORD question is trivially "fully covered", so coverage cannot
      // discriminate there. It must instead be a close match to a real alias:
      // otherwise "laser", "relativity" or "neutron" fuzzy-match their way to
      // an unrelated entry. A typo of a real topic ("calorimter") still clears
      // this comfortably; an unrelated word does not.
      if (score > 0 && qContent.length === 1) {
        const closest = Math.max(
          0,
          ...entry.aliases.flatMap((alias) =>
            contentTokens(alias).map((aw) => fuzzyTokenScore(qContent[0], aw)),
          ),
        );
        if (closest < singleWordBar) score = 0;
      }
    }
    // An entry that failed the coverage gate is OUT. The tie-break bonuses
    // below must never resurrect it: "neutron star" covers only half of what
    // was typed, and without this the +2 topic-name bonus alone carried the
    // "neutron" entry past the answer threshold, which is exactly the invented
    // answer the gate exists to prevent. Bonuses break ties between believable
    // matches; they are not evidence on their own.
    if (score <= 0) continue;
    // Small bonus for title-word overlap (fuzzy), to break near ties.
    for (const tk of contentTokens(entry.title)) {
      if (bestTokenScore(tk, qContent) >= 0.85) score += 0.5;
    }
    // A query that is essentially JUST the topic name ("what is the lhc")
    // should reach the entry that owns that name as an exact alias, rather
    // than a related entry that merely mentions it in a longer phrase.
    if (qContent.length <= 2) {
      const owns = entry.aliases.some((a) => {
        const w = contentTokens(a);
        return w.length === 1 && qContent.includes(w[0]);
      });
      if (owns) score += 2;
    }
    // Prefer the entry that can actually answer the KIND of question asked:
    // a "how do I" question should land on steps, a "why" on a purpose. Only
    // applied to an already-convincing match, so a facet bonus can never lift
    // an otherwise-weak entry above the no-match threshold.
    if (score >= matchThreshold) {
      if (intent === 'howto' && entry.howto) {
        // A dedicated task recipe is the best answer to a how-to question.
        score += entry.id.startsWith('task-') ? 3.5 : 2;
      } else if (intent === 'why' && entry.why) score += 1;
      else if (intent === 'where' && entry.where) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }
  // Require a real signal (a fuzzy whole-word alias or a phrase), not noise.
  return bestScore >= matchThreshold ? best : null;
}

/**
 * Find the topic a question ALMOST matched, for a "did you mean ...?" prompt.
 *
 * Answering requires a high-confidence match, because a confidently wrong
 * explanation is the worst thing a physics tutor can do. That strictness makes
 * an aggressive typo ("foton", "trigerr") fall just short. Rather than trade
 * safety for recall, those become a SUGGESTION: the student is offered the
 * topic and confirms, so the strict answer bar is never lowered.
 * @param text The user's question.
 * @param kb The knowledge base.
 * @returns A near-miss entry, or null when there is no answer and no near-miss.
 */
export function suggestKnowledge(
  text: string,
  kb: KnowledgeEntry[] = KNOWLEDGE_BASE,
): KnowledgeEntry | null {
  // Only when there is no confident answer to give.
  if (findKnowledge(text, kb)) return null;
  return findKnowledge(text, kb, RELAXED_SINGLE_WORD) ?? null;
}

/** The command metadata the derivation needs (a subset of `Command`). */
export interface DerivableCommand {
  /** Registered command name. */
  name: string;
  /** Human-readable label. */
  title?: string;
  /** What the command does. */
  description: string;
  /** Grouping category. */
  category: string;
  /** Whether it changes the view. */
  mutates?: boolean;
  /** Argument schema, used to tell whether it can be run with no input. */
  inputSchema?: { properties?: Record<string, unknown>; required?: string[] };
}

/**
 * Build knowledge entries FROM the command registry, so the tutor explains
 * features it was never explicitly taught.
 *
 * A curated base goes stale the moment a feature is added without a matching
 * entry. Commands, though, already describe themselves: every one carries a
 * title, description and category that were reviewed when it was added. Deriving
 * the answer from that metadata means a new command is explainable as soon as
 * it is registered, the answer can never contradict what the command actually
 * does, and each experiment (ATLAS, CMS, LHCb, TrackML) automatically gets
 * entries for whatever it registers.
 *
 * Commands the curated base already covers properly are skipped, so a rich
 * hand-written explanation is never displaced by a generated one-liner.
 * @param commands The registered commands.
 * @param curated The curated base to defer to.
 * @returns Generated entries for the commands not already covered.
 */
export function deriveCommandEntries(
  commands: DerivableCommand[],
  curated: KnowledgeEntry[] = KNOWLEDGE_BASE,
): KnowledgeEntry[] {
  const entries: KnowledgeEntry[] = [];
  for (const command of commands) {
    const title = command.title ?? command.name;
    // Defer to a curated explanation when one already exists for this topic.
    if (findKnowledge(title, curated)) continue;

    const spaced = command.name.replace(/[-_]+/g, ' ');
    const aliases = [...new Set([title.toLowerCase(), spaced, command.name])];
    const required = command.inputSchema?.required ?? [];
    const runnable = required.length === 0;

    entries.push({
      id: `command:${command.name}`,
      title,
      aliases,
      body: `${command.description} It is available as the "${title}" command (${command.category}), which you can run from the command palette with Ctrl/Cmd + K or by asking for it in plain language.`,
      howto: `Press Ctrl/Cmd + K to open the command palette, type "${title}", and press Enter${
        required.length ? `, then fill in: ${required.join(', ')}` : ''
      }. You can also ask for it in the Ask box in your own words.`,
      ...(runnable
        ? { action: { command: command.name, args: {}, label: `Run ${title}` } }
        : {}),
      related: ['command-palette'],
      tags: ['phoenix'],
    });
  }
  return entries;
}

/** Look up an entry by id (used to resolve `related` into titles). */
export function getKnowledgeEntry(
  id: string,
  kb: KnowledgeEntry[] = KNOWLEDGE_BASE,
): KnowledgeEntry | undefined {
  return kb.find((e) => e.id === id);
}

/**
 * The vetted content. Phoenix-feature descriptions follow the official user
 * guide; physics definitions are standard textbook definitions kept simple.
 */
export const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  // ---------- Phoenix: the application ----------
  {
    id: 'phoenix',
    title: 'Phoenix',
    aliases: [
      'phoenix',
      'this app',
      'this application',
      'this program',
      'this tool',
      'what is phoenix',
    ],
    body: 'Phoenix is a web-based, experiment-independent event display for high-energy physics. It runs entirely in your browser and shows detector geometry together with real reconstructed event data (tracks, jets, calorimeter deposits and more) in 3D. It is supported by the HEP Software Foundation and is the official web event display of the ATLAS experiment.',
    related: ['event-display', 'atlas', 'hsf', 'event'],
    tags: ['phoenix'],
  },
  {
    id: 'event-display',
    title: 'Event display',
    aliases: [
      'event display',
      'event viewer',
      'visualization',
      'visualiser',
      'display',
    ],
    body: 'An event display draws the particles and detector of a single collision so people can see what happened. Phoenix renders the reconstructed objects in 3D so you can rotate, zoom and inspect them, which helps with understanding events, outreach and masterclasses.',
    related: ['phoenix', 'event'],
    tags: ['phoenix'],
  },
  {
    id: 'phoenix-menu',
    title: 'The Phoenix menu',
    aliases: ['phoenix menu', 'the menu', 'side menu', 'tree menu', 'menu'],
    body: 'The Phoenix menu (top-right) controls what geometry and event data is shown and how. Each item has a visibility toggle, a gear for options such as opacity, colour and cuts on collections, and can expand into sub-items.',
    howto:
      'Each menu item has a slider on the left to show or hide it, its name, a gear icon that opens its options (such as opacity, colour, or cuts on a collection), and an arrow to expand sub-items. The gear at the very top saves or loads the whole menu configuration.',
    where: 'The panel at the top right of the screen.',
    related: ['iconbar', 'collections-info', 'cuts'],
    tags: ['phoenix'],
  },
  {
    id: 'iconbar',
    title: 'The Phoenix iconbar',
    aliases: [
      'iconbar',
      'icon bar',
      'toolbar',
      'bottom bar',
      'the icons',
      'tool bar',
    ],
    body: 'The iconbar along the bottom holds the interaction tools: the command palette, the event selector, zoom, view options, auto-rotate, dark/light theme, clipping, orthographic/perspective, the overlay view, object selection, animations, performance mode, VR/AR, screenshot options, import/export and shareable links. One of its buttons, More Info, opens the text panels: the info panel, the event browser, collections info, the eta-phi panel, the geometry browser and track kinematics.',
    related: ['phoenix-menu', 'command-palette', 'keyboard-controls'],
    tags: ['phoenix'],
  },
  {
    id: 'command-palette',
    title: 'The command palette',
    aliases: [
      'command palette',
      'this palette',
      'ask box',
      'ask phoenix',
      'command bar',
      'search commands',
    ],
    body: 'The command palette (Ctrl/Cmd + K, or the leftmost iconbar button) lets you run any Phoenix action by typing, or ask a question like this one in plain language. In "Ask" mode it maps your request to a command and runs it, or answers "what is..." questions.',
    howto:
      'Press Ctrl+K (Cmd+K on a Mac) or click the command palette button at the left of the iconbar. In Commands mode, type to filter the list and press Enter to run one, filling in any parameters it asks for. In Ask mode, type a request in plain language, or ask a question like this one.',
    where: 'Ctrl/Cmd+K, or the leftmost button in the iconbar.',
    related: ['iconbar', 'keyboard-controls'],
    tags: ['phoenix'],
  },
  {
    id: 'object-selection',
    title: 'Object selection',
    aliases: [
      'object selection',
      'select object',
      'selecting objects',
      'click an object',
      'picking',
    ],
    body: "With object selection enabled, clicking an object in the 3D view opens a window showing its reconstructed details (for example a track's momentum). It is how you inspect a single physics object.",
    howto:
      "Enable object selection from the iconbar, then click an object in the 3D view. A panel opens showing that object's reconstructed information. Click another object to inspect it instead.",
    why: 'It answers the most natural question a student has when looking at an event: what exactly is that thing I can see?',
    where: 'The object selection button in the iconbar.',
    related: ['collections-info', 'track'],
    tags: ['phoenix'],
  },
  {
    id: 'collections-info',
    title: 'Collections info panel',
    aliases: [
      'collections info',
      'collection information',
      'collections panel',
      'collection list',
      'list of collections',
    ],
    body: 'The collections info panel lists the event-data collections and their objects as text. Under the Selection column you can zoom the camera to an object or highlight it, and you can attach labels to objects here.',
    howto:
      'Open the More Info menu in the iconbar and choose collections info. Choose a collection to see its objects listed as text with their values. Each row has buttons to move the camera to that object, to highlight it in the 3D view, and to add, update or remove a label on it.',
    why: "It links the numbers to the picture: you can read an object's values and immediately jump the camera to it or highlight it, which is how you find one specific particle among hundreds.",
    where:
      'The collections info panel, under the More Info button in the iconbar.',
    related: ['object-selection', 'labels', 'event'],
    tags: ['phoenix'],
  },
  {
    id: 'info-panel',
    title: 'Info panel',
    aliases: ['info panel', 'information panel', 'info window'],
    body: 'The info panel, titled Messages Panel, shows the Phoenix version and the last ten things that happened in the display, such as which event and run was loaded and which objects you selected or deselected. It is a quick way to check what you just did.',
    howto:
      'Open the More Info button in the iconbar and tick Info Panel. The panel shows your most recent actions, newest first, and you can untick it to hide it again.',
    where: 'Under the More Info button in the iconbar.',
    related: ['collections-info'],
    tags: ['phoenix'],
  },
  {
    id: 'clipping',
    title: 'Geometry clipping',
    aliases: [
      'clipping',
      'object clipping',
      'clipping button',
      'clip',
      'slice',
      'cut away geometry',
      'clipping planes',
      'look inside',
      'see inside',
      'inside the detector',
    ],
    body: 'Clipping "slices" away part of the detector geometry so you can see the event data and structures hidden inside the outer layers. Turn it on from the iconbar or with Shift-C.',
    action: {
      command: 'set-clipping',
      args: { on: true },
      label: 'Turn on clipping',
    },
    howto:
      'Click the clipping button in the iconbar (or press Shift-C) to switch it on. The detector is cut away so you can see the event data and inner layers that the outer detector normally hides. Clipping angles can be adjusted from the Phoenix menu options.',
    why: 'The outer detector layers hide everything inside them. Slicing the geometry away is the only way to actually see the tracks and deposits at the centre where the collision happened.',
    where:
      'The clipping button in the iconbar, or the keyboard shortcut Shift-C.',
    related: ['detector', 'keyboard-controls'],
    tags: ['phoenix'],
  },
  {
    id: 'auto-rotate',
    title: 'Auto-rotate',
    aliases: [
      'auto rotate',
      'autorotate',
      'spin the detector',
      'orbit',
      'rotate the view',
      'spinning',
    ],
    body: 'Auto-rotate sets the camera slowly orbiting the origin so the detector turns on its own, which is handy for demos and screenshots. Toggle it from the iconbar or with Shift-R.',
    action: {
      command: 'toggle-auto-rotate',
      args: { on: true },
      label: 'Start auto-rotate',
    },
    howto:
      'Click the auto-rotate button in the iconbar, or press Shift-R. Click it again to stop. Moving the camera to a named view also stops the rotation so the view stays put.',
    where: 'The auto-rotate button in the iconbar, or Shift-R.',
    related: ['preset-views', 'keyboard-controls'],
    tags: ['phoenix'],
  },
  {
    id: 'dark-theme',
    title: 'Dark / light theme',
    aliases: [
      'dark theme',
      'light theme',
      'dark mode',
      'light mode',
      'night mode',
      'theme',
    ],
    body: 'Phoenix has a dark and a light theme; dark is easier on the eyes for 3D, light is better for printing and slides. Switch from the iconbar or with Shift-T.',
    action: {
      command: 'set-theme',
      args: { dark: true },
      label: 'Switch to dark theme',
    },
    howto:
      'Click the theme button in the iconbar, or press Shift-T, to switch between the dark and light themes.',
    where: 'The theme button in the iconbar, or Shift-T.',
    related: ['iconbar', 'keyboard-controls'],
    tags: ['phoenix'],
  },
  {
    id: 'preset-views',
    title: 'Preset views',
    aliases: [
      'preset views',
      'preset view',
      'named views',
      'camera views',
      'front view',
      'side view',
      'standard views',
    ],
    body: 'Preset views snap the camera to standard angles of the detector (for example a side or front-on view). Pick one from the "View options" iconbar button, or press Shift and a number.',
    howto:
      'Open View options in the iconbar and choose one of the listed preset views, or hold Shift and press the number of the view you want.',
    where: 'The View options button in the iconbar, or Shift plus a number.',
    related: ['auto-rotate', 'projection', 'keyboard-controls'],
    tags: ['phoenix'],
  },
  {
    id: 'projection',
    title: 'Orthographic / perspective view',
    aliases: [
      'orthographic',
      'perspective',
      'projection',
      'camera projection',
      'ortho',
      'orthographic view',
      'perspective view',
    ],
    body: 'Perspective view makes far objects look smaller (like the eye), while orthographic keeps parallel lines parallel, which is useful for reading geometry without distortion. Switch with the iconbar or Shift-V.',
    howto:
      'Press the camera projection button in the iconbar, whose tooltip says Switch to orthographic view or Switch to perspective view, or press Shift and V. You can also type switch to orthographic into the command palette.',
    where: 'The camera projection button in the iconbar.',
    action: { command: 'toggle-camera-projection', label: 'Toggle projection' },
    related: ['preset-views', 'keyboard-controls'],
    tags: ['phoenix'],
  },
  {
    id: 'axis',
    title: 'The axes',
    aliases: ['axis', 'axes', 'xyz axis', 'coordinate axes', 'show axis'],
    body: 'The axes draw the x, y and z directions at the origin so you can orient yourself. In detector coordinates z runs along the beam line. Show or hide them from the "View options" iconbar button.',
    action: {
      command: 'show-axis',
      args: { show: true },
      label: 'Show the axes',
    },
    related: ['eta', 'detector'],
    tags: ['phoenix'],
  },
  {
    id: 'zoom',
    title: 'Zooming and moving the camera',
    aliases: [
      'zoom',
      'zooming',
      'zoom in',
      'zoom out',
      'move the camera',
      'navigate',
      'get closer',
      'rotate the view with the mouse',
      'pan',
      'controls',
    ],
    body: 'You can move around the event freely: zoom to get closer to the collision point, orbit to look from another angle, and pan to shift the view.',
    howto:
      'Use the plus and minus buttons in the iconbar to zoom in and out, or Shift with the + and - keys. With the mouse, drag to orbit around the detector, scroll to zoom, and drag with the right button (or two fingers) to pan. The View options button also has preset views if you want a standard angle.',
    where:
      'The zoom buttons at the left of the iconbar, or Shift with the + and - keys.',
    related: ['preset-views', 'auto-rotate', 'keyboard-controls'],
    tags: ['phoenix'],
  },
  {
    id: 'overlay-view',
    title: 'Overlay view',
    aliases: ['overlay', 'overlay view', 'second view', 'inset view'],
    body: 'The overlay is a small separate view of the detector shown on top of the main one, so you can watch a fixed angle while you move the main camera.',
    howto:
      'Press the Overlay view button in the iconbar to open the small window. Its own buttons let you make its background transparent, fix it at its current angle, switch it between orthographic and perspective, link it so it follows the main camera, swap it with the main view, or copy the main camera angle into it once.',
    where: 'The Overlay view button in the iconbar.',
    related: ['iconbar'],
    tags: ['phoenix'],
  },
  {
    id: 'performance-mode',
    title: 'Performance mode',
    aliases: [
      'performance mode',
      'performance',
      'faster',
      'fps',
      'frame rate',
      'speed up',
      'lag',
      'performance toggle',
    ],
    body: 'Performance mode makes Phoenix run faster by switching off antialiasing, the smoothing of jagged edges, so each frame is cheaper to draw. Edges look slightly rougher, but it helps on laptops or with big events. The small frame-rate graph on the display shows whether it is helping.',
    howto:
      'Press the Performance mode button in the iconbar to switch it on, and press it again to go back to smoother edges.',
    where: 'The Performance mode button in the iconbar.',
    related: ['iconbar'],
    tags: ['phoenix'],
  },
  {
    id: 'vr-ar',
    title: 'VR / AR mode',
    aliases: [
      'vr',
      'ar',
      'vr mode',
      'ar mode',
      'virtual reality',
      'augmented reality',
      'headset',
      'webxr',
    ],
    body: 'Phoenix can enter Virtual Reality or Augmented Reality using WebXR, if your device or headset supports it. VR has been tested on Android phones and Oculus headsets; AR needs a recent Chrome on Android or the WebXR Viewer on iOS.',
    howto:
      'For virtual reality, press the VR button in the iconbar and put on your headset; press it again to leave. For augmented reality, open the AR button and choose AR with overlays or AR without overlays; press the button again to leave. If your device cannot do either, the button stays greyed out and says so when you hover over it.',
    where: 'The VR and AR buttons in the iconbar.',
    related: ['iconbar'],
    tags: ['phoenix'],
  },
  {
    id: 'screenshot',
    title: 'Screenshot mode',
    aliases: [
      'screenshot',
      'screen shot',
      'make picture',
      'save image',
      'export image',
      'take a picture',
      'save a picture',
      'picture for my report',
      'image for my report',
      'save the view',
    ],
    body: 'Screenshot mode hides all the overlays so you can capture a clean image of just the 3D scene. There is also a "make picture" tool for exporting the view.',
    howto:
      'Open the make picture button in the iconbar and choose screenshot mode to hide all the overlay panels so only the 3D scene is visible, then capture the image. The same button also exports the current view directly.',
    why: 'Reports, posters and slides need a clean image of just the event, without menus and panels covering it.',
    where:
      'The make picture button in the iconbar, which also holds the screenshot options.',
    related: ['share-link', 'event-state'],
    tags: ['phoenix'],
  },
  {
    id: 'share-link',
    title: 'Shareable link',
    aliases: [
      'share link',
      'shareable link',
      'share',
      'link to event',
      'url to event',
      'send this view',
    ],
    body: 'The "create shareable link" tool builds a URL that reopens the current experiment and view, so you can send exactly what you are looking at to someone else.',
    howto:
      'Open the shareable link tool in the iconbar. It builds a URL that reopens Phoenix with the current experiment and view, which you can paste to someone else.',
    where: 'The create shareable link button in the iconbar.',
    related: ['event-state', 'url-options'],
    tags: ['phoenix'],
  },
  {
    id: 'event-browser',
    title: 'Event browser',
    aliases: [
      'event browser',
      'browse events',
      'browse',
      'event list',
      'open event',
      'choose event',
    ],
    body: 'If set up on the server, the event browser lets you browse a directory of example events and load them, with search and filtering. You can also step between loaded events.',
    howto:
      'Open the More Info menu in the iconbar and choose the event browser. It lists the available events, with search and filters, and clicking one loads it into the display. When several events are already loaded you can also step between them with the next and previous controls.',
    why: 'Physics is statistical: one event tells you very little. Being able to move quickly between many events is how you find the rare interesting ones.',
    where:
      'Under the More Info button in the iconbar (available when set up on the server).',
    related: ['event', 'cycle-events'],
    tags: ['phoenix'],
  },
  {
    id: 'cycle-events',
    title: 'Cycling events',
    aliases: [
      'cycle events',
      'next event',
      'previous event',
      'change event',
      'switch event',
      'navigate events',
    ],
    body: 'When several events are loaded, each one is a separate collision snapshot, and you can step between them with the event selector dropdown in the iconbar, or by asking for the next or previous event in the command palette. Some experiment pages, such as LHCb, also have a cycle button that steps through the loaded events automatically every few seconds. Clicking it a second time keeps cycling and reloads the list when it reaches the end, which suits a live feed of events, and a third click stops it.',
    howto:
      'Choose an event from the event dropdown in the iconbar, or type next event or previous event into the command palette (Ctrl or Cmd with K). On pages with a cycle button, click it once to step through the loaded events automatically, a second time to keep going and reload the list at the end, and a third time to stop.',
    action: { command: 'next-event', label: 'Go to the next event' },
    related: ['event', 'event-browser'],
    tags: ['phoenix'],
  },
  {
    id: 'eta-phi',
    title: 'Eta-phi view',
    aliases: [
      'eta phi',
      'etaphi',
      'eta phi map',
      'eta phi view',
      'lego plot',
      'lego',
      'eta phi panel',
    ],
    body: 'The eta-phi view "unrolls" the detector into a flat 2D map: pseudorapidity (eta) along one axis and azimuthal angle (phi) along the other. Each object is plotted by its direction, so you can spot patterns like two objects back-to-back in phi at a glance. It sits under the More Info menu.',
    howto:
      'Open the More Info menu in the iconbar and choose the eta-phi panel. Each object in the event is plotted as a point at its eta (along the beam direction) and phi (around the beam). Hovering or reading the positions lets you spot structure quickly, such as two objects sitting opposite each other in phi.',
    why: 'A detector is a 3D cylinder, which is hard to read at a glance. Unrolling it into a flat eta-phi map makes patterns obvious, for example two back-to-back objects, which is how physicists spot interesting events quickly.',
    where: 'Under the More Info button in the iconbar.',
    related: ['eta', 'phi', 'kinematics'],
    tags: ['phoenix'],
  },
  {
    id: 'kinematics',
    title: 'Kinematics panel',
    aliases: [
      'kinematics',
      'kinematics panel',
      'momentum table',
      'track table',
      'kinematics table',
    ],
    body: 'The kinematics panel is a table of the reconstructed kinematics of objects such as tracks (for example transverse momentum, eta and phi), with configurable columns. It sits under the More Info menu and is useful for reading exact numbers rather than just the picture.',
    howto:
      'Open the More Info menu in the iconbar and choose the kinematics panel. Pick the collection you want (for example Tracks) and the table lists one row per object with its reconstructed numbers, such as transverse momentum, eta and phi. Use it when you need the exact values rather than the 3D picture; the columns shown are configurable per experiment.',
    why: 'The 3D view shows you the shape of an event, but physics measurements need numbers. The kinematics panel gives you the reconstructed values (momentum, direction) so you can compare objects and do real calculations.',
    where:
      'Under the More Info button in the iconbar at the bottom of the screen.',
    related: ['pt', 'eta', 'phi', 'track'],
    tags: ['phoenix'],
  },
  {
    id: 'masterclass',
    title: 'Masterclass mode',
    aliases: [
      'masterclass',
      'master class',
      'masterclass panel',
      'students',
      'tag particles',
    ],
    body: 'The masterclass is a simplified Phoenix for students: you tag particles in an event and measure quantities such as the invariant mass of a pair, the way real physicists search for particles. It presents a cut-down UI so the focus stays on the physics.',
    howto:
      'Open the masterclass panel. Step 1, choose a collection and tick the tracks you are interested in. Step 2, tag the selected tracks as a particle type. Step 3 shows your tagged particles. Step 4 shows the results, including the invariant mass in GeV for the combination you tagged.',
    why: "It lets students do what physicists actually do: pick candidate particles out of a real event and combine them to reconstruct the parent particle's mass, rather than just looking at a picture.",
    where:
      'The masterclass panel button in the iconbar (enabled in the masterclass setup).',
    related: ['invariant-mass', 'phoenix', 'hsf'],
    tags: ['phoenix'],
  },
  {
    id: 'labels',
    title: 'Labels',
    aliases: ['labels', 'label', 'annotate', 'annotation', 'text on objects'],
    body: 'Labels are text notes you can attach to individual physics objects from the collections info panel. You can save the labels to a JSON file and load them again later.',
    related: ['collections-info', 'event-state'],
    tags: ['phoenix'],
  },
  {
    id: 'event-state',
    title: 'Saving the event display state',
    aliases: [
      'save state',
      'load state',
      'event state',
      'save view',
      'restore view',
      'save configuration',
    ],
    body: 'Phoenix can save the current state (menu configuration, clipping and camera position) to a JSON file from the top Phoenix menu node, and load it back later, so a view is reproducible. It can also be loaded through the URL.',
    related: ['share-link', 'url-options', 'labels'],
    tags: ['phoenix'],
  },
  {
    id: 'url-options',
    title: 'URL options',
    aliases: [
      'url options',
      'url parameters',
      'query parameters',
      'load by url',
      'file parameter',
      'link parameters',
    ],
    body: 'Phoenix accepts URL parameters: "file" and "type" load an event data file (for example type=json or type=jivexml), "config" loads a saved state/config file, and "hideWidgets" hides the menu and iconbar for embedding.',
    related: ['event-state', 'share-link', 'data-formats'],
    tags: ['phoenix'],
  },
  {
    id: 'keyboard-controls',
    title: 'Keyboard shortcuts',
    aliases: [
      'keyboard',
      'keyboard controls',
      'shortcuts',
      'hotkeys',
      'key bindings',
      'keys',
    ],
    body: 'Handy shortcuts: Shift-T change theme, Shift-Number switch to that preset view, Shift-R rotate, Shift with + or - to zoom, Shift-C clipping, Shift-V orthographic/perspective. Ctrl/Cmd + K opens the command palette.',
    related: ['command-palette', 'iconbar'],
    tags: ['phoenix'],
  },
  {
    id: 'cuts',
    title: 'Cuts on collections',
    aliases: [
      'cut',
      'cuts',
      'filter',
      'filtering',
      'threshold',
      'pt cut',
      'selection cut',
    ],
    body: "A cut hides objects that fall outside a range of a quantity, for example only showing tracks above a chosen transverse momentum. In Phoenix, cuts on a collection are set from that collection's options (the gear) in the Phoenix menu.",
    howto:
      'In the Phoenix menu, find the collection you want (for example a track collection) and click its gear icon to open the options. The options include cuts, where you set the range of a quantity such as transverse momentum, and objects outside that range are hidden.',
    why: 'Real events contain hundreds of low-momentum tracks that hide the interesting ones. Cutting on a quantity such as momentum removes the clutter so the significant objects stand out.',
    where:
      'The gear icon next to a collection in the Phoenix menu (top right).',
    related: ['pt', 'phoenix-menu', 'collections-info'],
    tags: ['phoenix'],
  },

  // ---------- Physics: events and objects ----------
  {
    id: 'event',
    title: 'Event (collision)',
    aliases: ['event', 'collision', 'events', 'collisions', 'bunch crossing'],
    body: 'An event is one snapshot of a particle collision: everything the detector recorded when two beams crossed and particles interacted. Phoenix shows one event at a time, with all its reconstructed objects.',
    related: ['track', 'jet', 'vertex', 'detector'],
    tags: ['physics'],
  },
  {
    id: 'track',
    title: 'Track',
    aliases: [
      'track',
      'tracks',
      'trajectory',
      'charged particle path',
      'trajectories',
    ],
    body: "A track is the reconstructed path of a charged particle through the tracking detector. A magnetic field bends the path, and the amount of bending reveals the particle's momentum and charge. Tracks are usually drawn as curved lines from near the collision point.",
    why: 'Tracks are how charged particles are identified and measured: the curvature in the magnetic field gives the momentum and the sign of the charge, and where the tracks meet gives the collision point.',
    related: ['hit', 'vertex', 'pt', 'muon'],
    tags: ['physics'],
  },
  {
    id: 'hit',
    title: 'Hit',
    aliases: ['hit', 'hits', 'detector hit', 'space point'],
    body: "A hit is a single position measurement left when a particle passes through a layer of a tracking detector. A set of hits along a particle's path is what tracks are reconstructed from. Phoenix can draw hits as points, lines or boxes.",
    related: ['track', 'detector'],
    tags: ['physics'],
  },
  {
    id: 'jet',
    title: 'Jet',
    aliases: ['jet', 'jets', 'particle spray', 'cone'],
    body: 'A jet is a collimated spray of many particles produced when a quark or gluon is knocked out of a collision. Because quarks and gluons are never seen alone, they show up as jets. Phoenix draws each jet as a cone whose length reflects its energy.',
    why: 'Quarks and gluons can never be observed on their own, so a jet is the closest thing to seeing one. Counting and measuring jets is how the strong-force part of a collision is studied.',
    related: ['calorimeter', 'track', 'event'],
    tags: ['physics'],
  },
  {
    id: 'calorimeter',
    title: 'Calorimeter',
    aliases: ['calorimeter', 'calo', 'calorimeters', 'energy detector'],
    body: "A calorimeter measures a particle's energy by absorbing it and recording the resulting shower. It is segmented into cells, and the energy in each cell is what gets displayed. In Phoenix, calorimeter deposits are drawn as boxes whose length grows with the deposited energy.",
    related: ['calo-cell', 'calo-cluster', 'jet', 'detector'],
    tags: ['physics'],
  },
  {
    id: 'calo-cell',
    title: 'Calorimeter cell (CaloCell)',
    aliases: [
      'calo cell',
      'calocell',
      'calo cells',
      'calocells',
      'cell',
      'calorimeter cell',
    ],
    body: 'A calorimeter cell (CaloCell) is one segment of the calorimeter and the energy it recorded. Phoenix draws each cell as a box pointing outward from the beam, with its length set by the energy. There can be very many cells in one event.',
    related: ['calorimeter', 'calo-cluster', 'energy'],
    tags: ['physics', 'data'],
  },
  {
    id: 'calo-cluster',
    title: 'Calorimeter cluster (CaloCluster)',
    aliases: [
      'calo cluster',
      'calocluster',
      'clusters',
      'caloclusters',
      'cluster',
      'topocluster',
    ],
    body: 'A calorimeter cluster (CaloCluster) groups neighbouring cell energies into one reconstructed energy deposit, which is closer to a single particle or jet than the raw cells. It is drawn like a cell, as a box with length set by its energy.',
    related: ['calo-cell', 'calorimeter', 'jet'],
    tags: ['physics', 'data'],
  },
  {
    id: 'vertex',
    title: 'Vertex',
    aliases: ['vertex', 'vertices', 'interaction point', 'decay vertex'],
    body: 'A vertex is a point where particles originate: the primary vertex is where the collision happened, and secondary vertices are where unstable particles later decayed. Reconstructing vertices helps tell which tracks belong together.',
    why: 'Vertices separate what came from the main collision from what came from a later decay or from another overlapping collision, which is essential when hundreds of tracks are present.',
    related: ['track', 'event'],
    tags: ['physics'],
  },
  {
    id: 'missing-energy',
    title: 'Missing transverse energy (MET)',
    aliases: [
      'missing energy',
      'missing transverse energy',
      'met',
      'missing et',
      'metx',
      'imbalance',
    ],
    body: 'Missing transverse energy (MET) is an imbalance in the momentum measured across the plane transverse to the beam. Since that momentum should sum to zero, an imbalance signals particles that escaped undetected, such as neutrinos. Phoenix draws it as a dashed line in the transverse plane.',
    related: ['pt', 'muon', 'event'],
    tags: ['physics'],
  },
  {
    id: 'muon',
    title: 'Muon',
    aliases: ['muon', 'muons', 'mu particle'],
    body: 'A muon is a heavy cousin of the electron. It is charged but passes through the calorimeters with little loss, so it is identified in the outer muon detectors and leaves a track. Muon pairs are a classic way to reconstruct particles like the Z boson.',
    related: ['electron', 'track', 'invariant-mass'],
    tags: ['physics'],
  },
  {
    id: 'electron',
    title: 'Electron',
    aliases: ['electron', 'electrons'],
    body: 'An electron is a light charged lepton. It leaves a track in the tracker and dumps its energy in the electromagnetic calorimeter, so it shows up as a track pointing at a calorimeter deposit.',
    related: ['photon', 'muon', 'calorimeter', 'track'],
    tags: ['physics'],
  },
  {
    id: 'photon',
    title: 'Photon',
    aliases: ['photon', 'photons', 'gamma'],
    body: 'A photon is a particle of light and is electrically neutral, so it leaves no track but deposits its energy in the electromagnetic calorimeter. A calorimeter deposit with no matching track is a photon signature.',
    related: ['electron', 'calorimeter'],
    tags: ['physics'],
  },
  {
    id: 'eta',
    title: 'Pseudorapidity (eta)',
    aliases: ['eta', 'pseudorapidity'],
    body: "Pseudorapidity (eta) describes the angle of a particle relative to the beam line: eta near 0 means the particle goes out sideways (transverse), while large eta means it goes forward, close to the beam. It is used because differences in eta are the same regardless of the collision's boost along the beam.",
    why: 'Because collisions are boosted along the beam by an unknown amount, angles measured from the beam are not directly comparable between events. Differences in pseudorapidity are unchanged by that boost, so eta lets physicists compare directions fairly.',
    related: ['phi', 'pt', 'eta-phi'],
    tags: ['physics'],
  },
  {
    id: 'phi',
    title: 'Azimuthal angle (phi)',
    aliases: ['phi', 'azimuthal angle', 'azimuth'],
    body: "Phi is the azimuthal angle around the beam line, that is, where a particle points as you go around the circle transverse to the beam. Together eta and phi fix a particle's direction.",
    related: ['eta', 'eta-phi'],
    tags: ['physics'],
  },
  {
    id: 'pt',
    title: 'Transverse momentum (pT)',
    aliases: ['pt', 'transverse momentum', 'momentum', 'p t', 'transverse'],
    body: "Transverse momentum (pT) is the part of a particle's momentum in the plane perpendicular to the beam. It matters because, unlike momentum along the beam, the transverse momentum of the colliding partons is essentially zero, so the total pT of an event is conserved and useful for finding interesting particles.",
    why: 'The two protons collide head on, so the total momentum across the beam starts at essentially zero and must stay zero. Momentum along the beam is conserved too, but the colliding quarks and gluons carry unknown shares of it and most of the leftovers escape down the beam pipe, so only the transverse part can actually be measured, which is why nearly every LHC measurement is a transverse one.',
    related: ['eta', 'missing-energy', 'kinematics'],
    tags: ['physics'],
  },
  {
    id: 'energy',
    title: 'Energy',
    aliases: ['energy'],
    body: 'Particle energies in high-energy physics are measured in electronvolts, usually GeV (a billion eV). In Phoenix, jets and calorimeter deposits are drawn with a length that grows with their energy, so bigger boxes and cones mean more energy.',
    related: ['calorimeter', 'jet', 'pt'],
    tags: ['physics'],
  },
  {
    id: 'invariant-mass',
    title: 'Invariant mass',
    aliases: ['invariant mass', 'mass', 'reconstruct mass'],
    body: 'Invariant mass combines the energies and momenta of several particles into a single number that equals the mass of a parent particle they came from. Plotting the invariant mass of pairs (for example two muons) is how particles like the Z boson and the Higgs are found.',
    why: 'A parent particle decays long before it reaches the detector, so it can never be seen directly. Its mass is recovered from the decay products, and a peak at a fixed mass is what announces a real particle.',
    related: ['muon', 'masterclass', 'pt'],
    tags: ['physics'],
  },

  // ---------- Data formats ----------
  {
    id: 'data-formats',
    title: 'Event data formats',
    aliases: [
      'data format',
      'data formats',
      'file format',
      'file formats',
      'event file',
      'phoenix json',
      'json',
      'jivexml',
      'load data',
    ],
    body: 'Phoenix reads event data as Phoenix JSON (its own simple JSON format) and, for ATLAS, JiveXML. Geometry can be loaded as .obj, .gltf/.glb, .root or (gzipped) .json. The intermediate JSON format is what lets one display serve many experiments.',
    related: ['physlite', 'geometry-formats', 'url-options'],
    tags: ['data'],
  },
  {
    id: 'physlite',
    title: 'PHYSLITE (ATLAS ROOT)',
    aliases: [
      'physlite',
      'root file',
      'root data',
      'atlas root',
      'analysis format',
    ],
    body: 'PHYSLITE is a compact ATLAS analysis format stored in ROOT files. Phoenix can read PHYSLITE directly in the browser, so ATLAS open-data events can be shown without converting them first.',
    related: ['data-formats', 'atlas'],
    tags: ['data', 'detector'],
  },
  {
    id: 'geometry-formats',
    title: 'Geometry formats',
    aliases: [
      'geometry format',
      'geometry formats',
      'gltf',
      'glb',
      'obj file',
      'geometry file',
      'detector geometry',
    ],
    body: 'Detector geometry in Phoenix can be loaded from .obj, .gltf/.glb, .root or .json (optionally gzipped) files. GLTF is the usual choice and supports Phoenix extensions for naming and organising detector parts.',
    related: ['data-formats', 'detector'],
    tags: ['data'],
  },

  // ---------- Detector & organisations ----------
  {
    id: 'detector',
    title: 'The detector',
    aliases: [
      'detector',
      'subdetector',
      'sub detector',
      'detectors',
      'geometry',
    ],
    body: 'A collider detector is built in layers around the beam: an inner tracker measures charged-particle paths, calorimeters measure energy, and outer muon detectors catch muons. Phoenix shows this geometry so you can see where each object was measured; clipping helps you look inside.',
    why: 'Different particles behave differently, so a single technology cannot identify them all. Layering trackers, calorimeters and muon detectors lets each particle type be recognised by the pattern of where it left signals.',
    related: ['track', 'calorimeter', 'muon', 'clipping'],
    tags: ['detector'],
  },
  {
    id: 'atlas',
    title: 'ATLAS',
    aliases: ['atlas', 'atlas experiment', 'atlas detector'],
    body: "ATLAS is one of the large general-purpose experiments at CERN's Large Hadron Collider. Phoenix is its official web event display, showing the ATLAS geometry with physics objects such as tracks, jets and calorimeter cells.",
    related: ['cms', 'lhcb', 'detector', 'phoenix'],
    tags: ['detector'],
  },
  {
    id: 'cms',
    title: 'CMS',
    aliases: ['cms', 'cms experiment', 'cms detector'],
    body: "CMS is another large general-purpose experiment at CERN's Large Hadron Collider, alongside ATLAS. Phoenix has a CMS demo showing its geometry and objects, including its muon chambers.",
    related: ['atlas', 'lhcb', 'detector'],
    tags: ['detector'],
  },
  {
    id: 'lhcb',
    title: 'LHCb',
    aliases: ['lhcb', 'lhcb experiment', 'lhcb detector'],
    body: "LHCb is an experiment at CERN's Large Hadron Collider specialised in studying quark-flavour physics. Unlike ATLAS and CMS it is a forward spectrometer, laid out along the beam rather than wrapped around the collision, and Phoenix has a demo of its geometry and tracks.",
    related: ['atlas', 'cms', 'detector'],
    tags: ['detector'],
  },
  {
    id: 'trackml',
    title: 'TrackML',
    aliases: ['trackml', 'track ml', 'tracking challenge'],
    body: 'TrackML is a machine-learning challenge that used an imaginary detector to develop better track-reconstruction algorithms. Phoenix has a TrackML demo to visualise that detector and its hits.',
    related: ['track', 'hit', 'detector'],
    tags: ['detector'],
  },
  {
    id: 'hsf',
    title: 'HEP Software Foundation (HSF)',
    aliases: ['hsf', 'hep software foundation', 'software foundation'],
    body: 'The HEP Software Foundation (HSF) is a community that coordinates shared software across high-energy-physics experiments. Phoenix is an HSF project, which is why it is built to be experiment-independent and reusable.',
    related: ['phoenix', 'cern'],
    tags: ['hsf'],
  },
  {
    id: 'cern',
    title: 'CERN and the LHC',
    aliases: ['cern', 'geneva', 'european laboratory'],
    body: 'CERN is the European laboratory near Geneva that runs the Large Hadron Collider (LHC), a 27 km ring that collides protons at very high energy. Experiments like ATLAS, CMS and LHCb record those collisions, and Phoenix visualises the results.',
    related: ['atlas', 'detector', 'event'],
    tags: ['hsf', 'detector'],
  },

  // ---------- More Phoenix features ----------
  {
    id: 'geometry-browser',
    title: 'Geometry browser',
    aliases: [
      'geometry browser',
      'browse geometry',
      'detector parts',
      'subdetector list',
      'show hide geometry',
      'toggle geometry',
    ],
    body: 'The geometry browser lets you browse the detector parts and show or hide them individually, with a search box, so you can peel the detector down to just the pieces you want to see.',
    howto:
      'Open the geometry browser from the More Info menu. It lists the detector parts, with a search box to find one by name and a toggle per part to show or hide it. Hiding the outer parts is a quick way to reveal what is inside without using clipping.',
    why: 'Detectors have many layers. Being able to hide individual parts lets you build up the picture piece by piece instead of looking at an opaque block.',
    where: 'Under the More Info button in the iconbar.',
    related: ['detector', 'clipping', 'phoenix-menu'],
    tags: ['phoenix'],
  },
  {
    id: 'event-data-explorer',
    title: 'Event data explorer',
    aliases: [
      'event data explorer',
      'data explorer',
      'browse event data',
      'load event from directory',
      'event data from directory',
    ],
    body: 'The event data explorer is an optional tool a Phoenix site can add when it serves event files from its own server. It opens a window listing the event data files available there, and choosing one loads it into the display. The standard Phoenix demo pages do not include it, so to move between events that are already loaded, use the event selector instead.',
    howto:
      'Where a site includes it, press the Browse events in data directory button in the iconbar, then pick a file from the list that opens to load it. If you do not see that button, the page you are on does not provide it.',
    related: ['event-browser', 'data-formats', 'event'],
    tags: ['phoenix'],
  },
  {
    id: 'animations',
    title: 'Animations',
    aliases: [
      'animation',
      'animations',
      'animate event',
      'animate camera',
      'collision animation',
      'preset animation',
      'fly through',
      'camera animation',
    ],
    body: 'Phoenix can animate an event: the collision animation replays the event building up as if the particles were just produced, and preset camera animations fly the camera through the detector for a cinematic tour. Both are on the iconbar.',
    howto:
      'For the collision animation, press the Animate event button in the iconbar: the event builds up over about ten seconds, as if the particles were only just produced. For a camera tour, open the Preset animations button in the iconbar, pick a tour such as Cavern to ID or Animate camera, and press Play. The Download button next to each tour records it as a video file you can keep.',
    where: 'The Animate event and Preset animations buttons in the iconbar.',
    related: ['auto-rotate', 'event', 'screenshot'],
    tags: ['phoenix'],
  },
  {
    id: 'sessions',
    title: 'Phoenix sessions (record and replay)',
    aliases: [
      'session',
      'sessions',
      'record',
      'recording',
      'replay',
      'screen recording',
      'record a session',
      'phoenix sessions',
    ],
    body: 'Phoenix sessions let you record what you do in the display and replay it later, so you can capture a guided walkthrough of an event and share it. A small pill shows the recording or replay state.',
    related: ['share-link', 'event-state', 'screenshot'],
    tags: ['phoenix'],
  },
  {
    id: 'experiment-info',
    title: 'Experiment info',
    aliases: [
      'experiment info',
      'experiment logo',
      'run info',
      'event info',
      'which experiment',
    ],
    body: 'The experiment info box shows the experiment logo, which links to that experiment at CERN, a short title, and details of the event on screen such as its run and event number, updated whenever the event changes. It appears on some experiment pages, such as LHCb, CMS and the ATLAS masterclass, and you can drag it out of the way.',
    howto:
      'Read the run and event number straight from the box. Click the experiment logo to open that experiment page at CERN, and drag the box by its edge if it is covering part of the event.',
    related: ['run-event-number', 'event'],
    tags: ['phoenix'],
  },
  {
    id: 'import-export',
    title: 'Import / export',
    aliases: [
      'import',
      'export',
      'load data',
      'load geometry',
      'open file',
      'upload',
      'load event',
      'io options',
    ],
    body: 'The import/export tool loads new event data or detector geometry into Phoenix (depending on the configuration), and can export the current view. Supported inputs include Phoenix JSON and JiveXML event data and .obj/.gltf/.root/.json geometry.',
    howto:
      'Open the import/export tool in the iconbar and choose the file to load. Event data can be Phoenix JSON or, for ATLAS, JiveXML; geometry can be .obj, .gltf/.glb, .root or .json. You can also load a file straight from a URL using the file and type URL parameters.',
    where: 'The import/export button in the iconbar.',
    related: ['data-formats', 'geometry-formats', 'url-options'],
    tags: ['phoenix'],
  },
  {
    id: 'colors',
    title: 'Object colours',
    aliases: [
      'color',
      'colour',
      'colors',
      'colours',
      'why is it red',
      'what do the colors mean',
      'colour code',
    ],
    body: "Object colours in Phoenix are set by each experiment's configuration rather than a universal code, and you can change a collection's colour from its options (the gear) in the Phoenix menu. So a colour tells you which collection an object belongs to in that setup, not a fixed physics meaning.",
    related: ['phoenix-menu', 'collections-info'],
    tags: ['phoenix'],
  },

  // ---------- Particle physics for masterclasses ----------
  {
    id: 'standard-model',
    title: 'The Standard Model',
    aliases: ['standard model', 'sm', 'particle physics theory'],
    body: 'The Standard Model is the theory that describes the known fundamental particles (quarks and leptons) and the forces between them, carried by bosons. It is extremely well tested; its last piece, the Higgs boson, was found at the LHC in 2012. It does not include gravity.',
    related: ['particle', 'boson', 'higgs-boson', 'lepton', 'quark'],
    tags: ['physics'],
  },
  {
    id: 'particle',
    title: 'Fundamental particle',
    aliases: [
      'particle',
      'particles',
      'fundamental particle',
      'elementary particle',
    ],
    body: 'A fundamental particle is a building block of nature with no known smaller parts. In the Standard Model these are the quarks and leptons (matter) and the bosons that carry forces.',
    related: ['standard-model', 'fermion', 'boson', 'quark', 'lepton'],
    tags: ['physics'],
  },
  {
    id: 'fermion',
    title: 'Fermion',
    aliases: ['fermion', 'fermions', 'matter particle'],
    body: 'Fermions are the matter particles: the quarks and the leptons. They cannot occupy the same state as each other, which is why matter takes up space.',
    related: ['boson', 'quark', 'lepton'],
    tags: ['physics'],
  },
  {
    id: 'boson',
    title: 'Boson',
    aliases: ['boson', 'bosons', 'force carrier'],
    body: 'Bosons are the particles with whole-number spin. Four of them carry the forces: the photon (electromagnetism), the W and Z (weak force) and the gluon (strong force). The Higgs is also a boson, but it is the particle of the Higgs field rather than a force carrier. Unlike fermions, many bosons can share the same state.',
    related: ['fermion', 'photon', 'z-boson', 'w-boson', 'higgs-boson'],
    tags: ['physics'],
  },
  {
    id: 'lepton',
    title: 'Lepton',
    aliases: ['lepton', 'leptons'],
    body: 'Leptons are fundamental fermions that do not feel the strong force. The charged leptons are the electron, the muon and the tau, and each comes paired with a neutrino.',
    related: ['electron', 'muon', 'tau', 'neutrino', 'quark'],
    tags: ['physics'],
  },
  {
    id: 'quark',
    title: 'Quark',
    aliases: ['quark', 'quarks', 'up quark', 'down quark'],
    body: 'Quarks are fundamental fermions that feel the strong force. They are never seen alone: they bind into composite particles called hadrons (like protons), and when knocked out of a collision they appear as jets.',
    related: ['hadron', 'jet', 'proton', 'lepton'],
    tags: ['physics'],
  },
  {
    id: 'hadron',
    title: 'Hadron',
    aliases: ['hadron', 'hadrons', 'composite particle', 'meson', 'baryon'],
    body: 'A hadron is a particle made of quarks held together by the strong force, such as the proton and neutron. Hadrons are what most of the particles in a jet are.',
    related: ['quark', 'proton', 'jet'],
    tags: ['physics'],
  },
  {
    id: 'neutrino',
    title: 'Neutrino',
    aliases: ['neutrino', 'neutrinos', 'invisible particle'],
    body: 'A neutrino is a neutral, almost massless lepton that barely interacts, so detectors cannot see it directly. Its presence is inferred as missing transverse energy: momentum that seems to vanish from the event.',
    related: ['missing-energy', 'lepton', 'w-boson'],
    tags: ['physics'],
  },
  {
    id: 'tau',
    title: 'Tau lepton',
    aliases: ['tau', 'tau lepton', 'tauon'],
    body: 'The tau is the heaviest charged lepton, a much heavier cousin of the electron and muon. It is unstable and decays almost immediately, so it is seen through its decay products.',
    related: ['lepton', 'electron', 'muon', 'decay'],
    tags: ['physics'],
  },
  {
    id: 'proton',
    title: 'Proton',
    aliases: ['proton', 'protons', 'what collides', 'beam particles'],
    body: 'A proton is a positively charged hadron made of quarks, and one of the particles that make up atomic nuclei. The LHC accelerates two beams of protons and collides them head-on.',
    related: ['quark', 'hadron', 'beam', 'cern'],
    tags: ['physics'],
  },
  {
    id: 'antimatter',
    title: 'Antimatter and the positron',
    aliases: ['antimatter', 'antiparticle', 'anti particle'],
    body: "Every particle has an antiparticle with the opposite electric charge and the same mass; the electron's antiparticle is the positron. When a particle meets its antiparticle they annihilate into energy.",
    related: ['electron', 'charge', 'particle'],
    tags: ['physics'],
  },
  {
    id: 'z-boson',
    title: 'Z boson',
    aliases: ['z boson', 'z0', 'neutral boson', 'z particle'],
    body: 'The Z boson is a heavy, electrically neutral carrier of the weak force. It is often found through its decay into two opposite-sign leptons, such as two muons or two electrons, which is a favourite masterclass measurement.',
    related: ['w-boson', 'boson', 'muon', 'dilepton', 'invariant-mass'],
    tags: ['physics'],
  },
  {
    id: 'w-boson',
    title: 'W boson',
    aliases: ['w boson', 'w particle', 'charged boson'],
    body: 'The W boson is a heavy, electrically charged carrier of the weak force. It typically decays into a charged lepton and a neutrino, so a W signature is one high-momentum lepton plus missing transverse energy.',
    related: ['z-boson', 'boson', 'neutrino', 'missing-energy'],
    tags: ['physics'],
  },
  {
    id: 'higgs-boson',
    title: 'Higgs boson',
    aliases: ['higgs', 'higgs boson', 'god particle', 'higgs particle'],
    body: 'The Higgs boson is the particle of the Higgs field, which gives other fundamental particles their mass. It was discovered at the LHC by ATLAS and CMS in 2012, seen through decays such as two photons or four leptons.',
    related: ['standard-model', 'boson', 'invariant-mass', 'photon'],
    tags: ['physics'],
  },
  {
    id: 'decay',
    title: 'Particle decay',
    aliases: ['decay', 'decays', 'decay products', 'unstable particle'],
    body: 'A decay is when an unstable particle transforms into lighter particles. Most interesting particles (like the Z, W and Higgs) decay almost instantly, so what the detector actually records are their decay products, which you combine to reconstruct the parent.',
    related: ['invariant-mass', 'vertex', 'resonance'],
    tags: ['physics'],
  },
  {
    id: 'signal-background',
    title: 'Signal and background',
    aliases: ['signal', 'background', 'signal vs background', 'noise'],
    body: 'The signal is the process you are trying to find; the background is every other process that can look similar. Discovering a particle means seeing more events than the background alone can explain.',
    related: ['resonance', 'trigger', 'invariant-mass'],
    tags: ['physics'],
  },
  {
    id: 'resonance',
    title: 'Resonance (mass peak)',
    aliases: ['resonance', 'mass peak', 'bump', 'peak', 'mass distribution'],
    body: "A resonance is a bump in an invariant-mass distribution sitting at a particle's mass. When you histogram the invariant mass of many events, a real particle shows up as a peak above the smooth background.",
    related: ['invariant-mass', 'signal-background', 'z-boson'],
    tags: ['physics'],
  },
  {
    id: 'dilepton',
    title: 'Dilepton / dimuon events',
    aliases: [
      'dilepton',
      'dimuon',
      'dielectron',
      'two muons',
      'two leptons',
      'lepton pair',
      'opposite sign',
    ],
    body: 'A dilepton event has two leptons, for example two muons (dimuon) or two electrons. An opposite-sign lepton pair is the classic signature of a Z boson, and computing its invariant mass reveals the parent particle. The Higgs is found through four leptons, which is two such pairs, because it decays to two Z bosons first.',
    related: ['z-boson', 'muon', 'invariant-mass', 'masterclass'],
    tags: ['physics'],
  },
  {
    id: 'charge',
    title: 'Electric charge',
    aliases: [
      'charge',
      'electric charge',
      'positive negative',
      'sign of charge',
    ],
    body: "Electric charge is the property that makes a particle feel the electromagnetic force. In the detector it shows up directly: a charged particle's track curves in the magnetic field, and the direction of the curve tells you whether the charge is positive or negative.",
    related: ['track', 'antimatter', 'muon'],
    tags: ['physics'],
  },
  {
    id: 'trigger',
    title: 'Trigger',
    aliases: ['trigger', 'triggering', 'event selection', 'data acquisition'],
    body: 'The trigger is the fast, real-time system that decides which collisions to save, because far too many happen to record them all. It keeps events that look interesting (for example a high-momentum lepton) and discards the rest.',
    why: 'The LHC produces far more collisions than could ever be recorded, so a decision has to be made in real time about which ones to keep. Almost all data is discarded, by design.',
    related: ['luminosity', 'signal-background', 'event'],
    tags: ['physics'],
  },
  {
    id: 'luminosity',
    title: 'Luminosity and lumi blocks',
    aliases: [
      'luminosity',
      'lumi',
      'lumi block',
      'luminosity block',
      'how much data was recorded',
    ],
    body: 'Luminosity measures how many collisions the collider delivers per area per time; more luminosity means more data and a better chance of rare events. Data is recorded in short "luminosity blocks" of roughly constant conditions.',
    related: ['trigger', 'run-event-number', 'pileup'],
    tags: ['physics'],
  },
  {
    id: 'run-event-number',
    title: 'Run and event numbers',
    aliases: [
      'run number',
      'event number',
      'run and event',
      'event id',
      'lumiblock number',
    ],
    body: 'The run number labels a period of data-taking and the event number labels a specific collision within it, so together they uniquely identify an event. Phoenix usually shows them alongside the experiment logo.',
    related: ['experiment-info', 'event', 'luminosity'],
    tags: ['physics'],
  },
  {
    id: 'pileup',
    title: 'Pileup',
    aliases: [
      'pileup',
      'pile up',
      'multiple collisions',
      'overlapping collisions',
    ],
    body: 'Pileup is the extra proton-proton collisions that happen in the same beam crossing as the one you care about, overlapping their particles in the detector. High luminosity brings more pileup, which makes reconstruction harder.',
    why: 'Extra overlapping collisions add tracks and energy that did not come from the interesting event, so understanding pileup is necessary before any measurement can be trusted.',
    related: ['luminosity', 'vertex', 'event'],
    tags: ['physics'],
  },
  {
    id: 'coordinate-system',
    title: 'Detector coordinates',
    aliases: [
      'coordinate system',
      'coordinates',
      'transverse plane',
      'z axis beam',
      'r phi z',
      'longitudinal',
    ],
    body: 'Collider detectors use z along the beam line, the transverse plane (x-y) perpendicular to it, and phi as the angle around the beam; r is the distance from the beam. "Transverse" quantities are measured in that perpendicular plane.',
    related: ['axis', 'eta', 'phi', 'pt'],
    tags: ['physics'],
  },
  {
    id: 'calorimeter-types',
    title: 'Electromagnetic vs hadronic calorimeter',
    aliases: [
      'electromagnetic calorimeter',
      'hadronic calorimeter',
      'ecal',
      'hcal',
      'em calorimeter',
    ],
    body: "The electromagnetic calorimeter (inner) measures electrons and photons, while the hadronic calorimeter (outer) measures hadrons and jets. Together they capture nearly all of a particle's energy as it showers.",
    related: ['calorimeter', 'shower', 'jet'],
    tags: ['physics'],
  },
  {
    id: 'shower',
    title: 'Particle shower',
    aliases: ['shower', 'showers', 'cascade', 'particle cascade'],
    body: "A shower is the cascade of many secondary particles created when a high-energy particle is absorbed in a calorimeter. Measuring the shower is how the calorimeter works out the original particle's energy.",
    related: ['calorimeter', 'calorimeter-types', 'energy'],
    tags: ['physics'],
  },
  {
    id: 'reconstruction',
    title: 'Reconstruction',
    aliases: [
      'reconstruction',
      'reconstructed',
      'reco',
      'how objects are made',
    ],
    body: 'Reconstruction is the process of turning raw detector signals (hits and energy deposits) into the physics objects you actually look at, such as tracks, jets and vertices. Phoenix displays these reconstructed objects, not the raw electronics.',
    related: ['track', 'jet', 'vertex', 'hit'],
    tags: ['physics'],
  },
  {
    id: 'beam',
    title: 'The beam and beam pipe',
    aliases: ['beam', 'beam pipe', 'beam line', 'beamline'],
    body: 'The beam is the stream of protons travelling along the centre of the detector inside the beam pipe, and it defines the z axis. Collisions happen where the two beams cross at the centre of the experiment.',
    related: ['proton', 'coordinate-system', 'detector'],
    tags: ['physics'],
  },

  // ---------- Interpretation: what am I actually looking at ----------
  {
    id: 'is-this-a-photo',
    title: 'Is this a photograph of the collision?',
    aliases: [
      'is this a photo',
      'is this a photograph',
      'is this real',
      'is this a picture of a collision',
      'is this a simulation',
      'did this really happen',
      'photograph of a collision',
      'real collision',
      'really happened',
    ],
    body: 'No. Nothing here is a photograph. Detectors record electrical signals from thousands of sensors, and reconstruction software turns those signals into objects such as tracks and energy deposits. What you see is that reconstructed result drawn onto a model of the detector. When you are looking at recorded collision data the measurements behind the picture are real, and when you are looking at simulated data they came from a physics simulation, but either way the picture is a visualisation of measurements, not an image of particles.',
    why: 'It matters because a track is a fitted curve through a handful of measured points, not a photographed trail. Knowing that keeps you from over-reading the picture.',
    related: ['track', 'reconstruction', 'monte-carlo', 'hit'],
    tags: ['physics', 'phoenix'],
  },
  {
    id: 'magnetic-field',
    title: 'Why tracks curve (the magnetic field)',
    aliases: [
      'why do tracks curve',
      'why are tracks curved',
      'curved tracks',
      'magnetic field',
      'magnet',
      'why bent',
      'curvature',
      'why do the lines bend',
    ],
    body: 'Detectors are built inside a powerful magnet. A charged particle moving through a magnetic field is deflected, so its path bends into a curve. The amount of bending depends on its momentum: high-momentum particles are barely deflected and look almost straight, while low-momentum ones curl tightly.',
    why: 'The curvature is the measurement. Bending is how the momentum is determined, and the direction of the bend tells you whether the charge is positive or negative. Without the magnet a tracker could not measure momentum at all.',
    related: ['track', 'charge', 'pt', 'detector'],
    tags: ['physics'],
  },
  {
    id: 'empty-event',
    title: 'Why does the event look empty?',
    aliases: [
      'nothing is showing',
      'event looks empty',
      'looks empty',
      'why is it empty',
      'no tracks visible',
      'blank screen',
      'nothing is displayed',
      'nothing rendered',
    ],
    body: 'Usually nothing is wrong. The most common reasons are that the collections are switched off in the Phoenix menu, that a cut is hiding the objects, that the camera is pointing away from or is inside the detector, or that no event has been loaded yet.',
    howto:
      "Check the Phoenix menu (top right) and make sure the event data collections are toggled on. Open a collection's gear options and widen any cuts you set. Zoom out or pick a preset view from View options to reframe the camera. If nothing is loaded, use the event browser or import/export to load an event.",
    related: ['phoenix-menu', 'cuts', 'preset-views', 'event-browser'],
    tags: ['phoenix'],
  },
  {
    id: 'lhc-status',
    title: 'Is the LHC running right now?',
    aliases: [
      'is the lhc running',
      'is the lhc switched on',
      'lhc status',
      'lhc running',
      'long shutdown',
      'ls3',
      'lhc shutdown',
      'is cern running',
      'still running',
      'switched off',
    ],
    body: 'Not at the moment. The LHC finished its third run in June 2026 and entered Long Shutdown 3, a planned break of about four years for the High-Luminosity upgrade. The accelerator complex is expected to restart gradually from around 2028, with High-Luminosity LHC operation targeted for about 2030. These dates have moved before, so check the CERN website for the current status. Collision data recorded before the shutdown is just as real as it was when it was taken.',
    related: ['lhc', 'cern', 'open-data', 'luminosity'],
    tags: ['detector'],
  },
  {
    id: 'dark-matter',
    title: 'Dark matter',
    aliases: [
      'dark matter',
      'dark energy',
      'invisible matter',
      'missing mass of the universe',
    ],
    body: 'Astronomical observations show galaxies behave as though they contain far more mass than we can see. That unseen component is called dark matter, and it makes up roughly a quarter of the universe, against about five per cent for ordinary matter. It has never been observed directly; the LHC experiments look for it because a dark-matter particle produced in a collision would escape the detector and show up as missing transverse energy.',
    why: 'It is one of the clearest signs that the Standard Model is incomplete, which is a large part of why the LHC keeps taking data.',
    related: ['missing-energy', 'standard-model', 'neutrino', 'lhc'],
    tags: ['physics'],
  },
  {
    id: 'forces',
    title: 'The fundamental forces',
    aliases: [
      'fundamental forces',
      'four forces',
      'strong force',
      'weak force',
      'electromagnetic force',
      'gravity',
      'strong interaction',
    ],
    body: 'The Standard Model describes three forces: the strong force, which binds quarks into protons and neutrons; the electromagnetic force, which acts on charged particles; and the weak force, which is responsible for certain decays. Each is carried by particles (gluons, photons, and the W and Z bosons). Gravity is not part of the Standard Model.',
    related: ['standard-model', 'boson', 'quark', 'decay'],
    tags: ['physics'],
  },
  {
    id: 'units',
    title: 'GeV, TeV and electronvolts',
    aliases: [
      'gev',
      'mev',
      'electronvolt',
      'what does gev mean',
      'units',
      'is that a lot',
      'how much is a gev',
    ],
    body: "Particle energies are measured in electronvolts (eV). A GeV is a billion eV and a TeV is a thousand GeV. For scale, a proton's mass is about 1 GeV and the Higgs boson is about 125 GeV, so a track of a few GeV is ordinary while one of tens of GeV is notable. Masses and momenta are quoted in the same units, which is why you see momentum given in GeV.",
    related: ['energy', 'pt', 'invariant-mass', 'lhc-energy'],
    tags: ['physics'],
  },
  {
    id: 'discovery',
    title: 'How do physicists know a discovery is real?',
    aliases: ['how do you know', 'discovery', 'how sure are they', 'proof'],
    body: 'No single event proves anything, because ordinary processes can imitate almost any signature by chance. Physicists collect very many events and look for an excess above the expected background. By convention a discovery is only claimed at a significance of five sigma, meaning the chance of the background faking the excess is around one in a few million.',
    related: [
      'significance',
      'signal-background',
      'resonance',
      'invariant-mass',
    ],
    tags: ['physics'],
  },

  {
    id: 'limits',
    title: 'What Phoenix cannot do',
    aliases: [
      'simulate a collision',
      'simulate collisions',
      'generate events',
      'generate new events',
      'change the magnetic field',
      'change the magnetic field strength',
      'edit the geometry',
      'edit the detector geometry',
      'modify the detector',
      'export to excel',
      'export a spreadsheet',
      'run a fit',
      'fit a curve',
      'reprocess the data',
      'reconstruct the event myself',
      'change the reconstruction',
    ],
    body: "Phoenix is a viewer, not a physics program. It displays event data and geometry that were produced elsewhere, so it cannot simulate or generate collisions, re-run reconstruction, change detector conditions such as the magnetic field, edit the geometry, or fit and export data tables. Those jobs belong to the experiments' own software; Phoenix loads and shows the result.",
    why: 'Keeping the display read-only is what makes it trustworthy: everything you see came from real reconstructed data rather than from something the viewer made up.',
    related: ['reconstruction', 'data-formats', 'import-export', 'open-data'],
    tags: ['phoenix'],
  },

  // ---------- Task recipes: cross-topic "how do I ...?" ----------
  {
    id: 'task-filter-tracks',
    title: 'Filtering tracks (cuts on a collection)',
    aliases: [
      'filter tracks',
      'filter the tracks',
      'cut tracks',
      'only show tracks',
      'high pt tracks',
      'tracks above',
      'remove low momentum tracks',
      'hide small tracks',
      'too many tracks',
    ],
    body: 'Filtering means hiding the objects outside a range of some quantity, most often keeping only tracks above a chosen transverse momentum so the busy low-momentum ones stop hiding the interesting event.',
    howto:
      "Open the Phoenix menu (top right) and find the track collection you want. Click its gear icon to open that collection's options, which include cuts. Set the range for the quantity you want to cut on, for example a minimum transverse momentum, and objects outside the range are hidden. Widen the range again to bring them back.",
    why: 'A single LHC collision produces hundreds of low-momentum tracks. Cutting them away is how you make the few high-momentum tracks that signal something interesting actually visible.',
    where: 'The gear icon next to the collection in the Phoenix menu.',
    related: ['cuts', 'track', 'pt', 'phoenix-menu'],
    tags: ['phoenix'],
  },
  {
    id: 'task-invariant-mass',
    title: 'Measuring an invariant mass',
    aliases: [
      'measure invariant mass',
      'measure the mass',
      'calculate invariant mass',
      'calculate the mass',
      'measure the invariant mass',
      'measure invariant',
      'how to measure mass',
      'work out the invariant mass',
      'combine two particles',
      'invariant mass of two',
      'mass of two muons',
      'reconstruct a particle',
      'find the z boson',
      'tag particles',
    ],
    body: 'Combining two (or more) reconstructed particles gives their invariant mass, which equals the mass of the parent particle they came from. Seeing a peak at a particular mass is how particles such as the Z boson are identified.',
    howto:
      'Open the masterclass panel. Step 1, choose the collection and tick the tracks you think came from the decay (for example two muons). Step 2, tag the selected tracks as a particle type. Step 3 lists what you have tagged. Step 4 shows the results, including the invariant mass in GeV. Compare that number with the known particle masses to see what you found.',
    why: 'It is the actual method physicists use to discover particles: you cannot see the parent particle directly because it decays immediately, so you reconstruct it from its decay products.',
    where: 'The masterclass panel in the iconbar.',
    related: ['invariant-mass', 'masterclass', 'muon', 'dilepton', 'z-boson'],
    tags: ['phoenix', 'physics'],
  },
  {
    id: 'task-inspect-object',
    title: 'Inspecting one object (its numbers)',
    aliases: [
      'see the numbers',
      'read the numbers',
      'inspect an object',
      'inspect a track',
      'details of a track',
      'information about an object',
      'values of a track',
      'momentum of a track',
      'click on a track',
    ],
    body: 'Every object drawn in the 3D view has reconstructed values behind it, such as momentum and direction, and Phoenix gives you several ways to read them.',
    howto:
      'There are three good ways. Enable object selection in the iconbar and click the object in the 3D view to open its information. Or open the collections info panel, find the object in the list, and use its buttons to move the camera to it or highlight it. Or open the kinematics panel from the More Info menu to see a whole collection as a table of numbers.',
    why: 'The picture tells you the shape of an event; the numbers are what you actually measure with. Physics conclusions come from the values, not the render.',
    related: ['object-selection', 'collections-info', 'kinematics', 'track'],
    tags: ['phoenix'],
  },
  {
    id: 'task-find-particles',
    title: 'Finding particles in an event',
    aliases: [
      'find the two muons',
      'find a jet',
      'find the electrons',
      'locate a particle',
      'where are the muon tracks',
      'show me the muon tracks',
    ],
    body: 'Particles are grouped into named collections (Muons, Electrons, Jets, Tracks and so on), so finding them means finding the right collection and then the object within it.',
    howto:
      'Open the More Info menu in the iconbar, choose collections info, and pick the collection you want, for example Muons. Each row is one object, and its buttons move the camera to it or highlight it in the 3D view. You can also hide the other collections from the Phoenix menu so only the ones you care about are drawn.',
    related: [
      'collections-info',
      'muon',
      'phoenix-menu',
      'task-inspect-object',
    ],
    tags: ['phoenix'],
  },

  // ---------- CERN / LHC ecosystem ----------
  {
    id: 'lhc',
    title: 'The Large Hadron Collider (LHC)',
    aliases: [
      'lhc',
      'large hadron collider',
      'the collider',
      'how big is the lhc',
      'size of the lhc',
    ],
    body: "The LHC is the world's largest and most powerful particle accelerator: a ring about 27 km around (26 659 m), roughly 100 m underground on the French-Swiss border at CERN. It uses 9593 magnets, including 1232 main dipoles, cooled to 1.9 K (-271.3 C), to steer two beams of protons (or heavy ions) in opposite directions and collide them. It first started up on 10 September 2008.",
    why: 'Higher collision energy lets physicists create heavier particles that do not exist in everyday matter, which is how the Higgs boson was found. It is essentially a microscope for the smallest scales.',
    related: ['cern', 'lhc-energy', 'lhc-experiments', 'proton', 'detector'],
    tags: ['detector', 'hsf'],
  },
  {
    id: 'lhc-energy',
    title: 'LHC collision energy',
    aliases: [
      'collision energy',
      'how much collision energy',
      'beam energy',
      'what energy does it run at',
    ],
    body: 'In its third run, from 2022 until June 2026, the LHC collided protons at a nominal energy of 13.6 TeV (teraelectronvolts), the highest ever reached in a laboratory. That is the combined energy of the two beams; a TeV is a trillion electronvolts.',
    why: 'Energy converts into mass, so a higher collision energy means heavier particles can be produced. Rare, heavy particles only appear if there is enough energy to make them.',
    related: ['lhc', 'energy', 'pt'],
    tags: ['detector'],
  },
  {
    id: 'lhc-experiments',
    title: 'The LHC experiments',
    aliases: [
      'lhc experiments',
      'experiments at the lhc',
      'which experiments',
      'detectors at cern',
      'four experiments',
    ],
    body: 'Four large detectors sit at the points where the LHC beams cross: ATLAS and CMS (general-purpose experiments, which both found the Higgs boson), ALICE (heavy-ion collisions and quark-gluon plasma) and LHCb (quark-flavour physics). Several smaller experiments also run at the LHC, including LHCf, TOTEM, MoEDAL-MAPP, FASER and SND@LHC.',
    related: ['atlas', 'cms', 'lhcb', 'alice', 'lhc'],
    tags: ['detector'],
  },
  {
    id: 'alice',
    title: 'ALICE',
    aliases: ['alice', 'alice experiment', 'heavy ion experiment'],
    body: 'ALICE is the LHC experiment specialised in heavy-ion collisions, where lead nuclei are collided to create a quark-gluon plasma, the extremely hot and dense state of matter thought to have existed just after the Big Bang. Phoenix does not ship an ALICE demo.',
    related: ['lhc-experiments', 'atlas', 'cms', 'lhcb'],
    tags: ['detector'],
  },
  {
    id: 'accelerator',
    title: 'Particle accelerator',
    aliases: [
      'particle accelerator',
      'accelerator',
      'how does an accelerator work',
      'accelerate particles',
    ],
    body: 'A particle accelerator uses electric fields to push charged particles to very high speeds and magnetic fields to steer and focus them. At the LHC the particles travel in a ring, gaining energy on each lap, until two beams are steered into each other inside a detector.',
    why: 'To study the smallest structures you need the highest energies: high-energy collisions both resolve small distances and create heavy, short-lived particles that can then be studied.',
    related: ['lhc', 'cern', 'beam', 'proton'],
    tags: ['detector'],
  },
  {
    id: 'lhc-safety',
    title: 'Is the LHC dangerous?',
    aliases: [
      'is the lhc dangerous',
      'lhc dangerous',
      'lhc safety',
      'collider safety',
      'black hole',
      'black holes',
      'destroy the planet',
      'destroy the earth',
      'end the world',
      'is the lhc safe',
      'is it safe',
    ],
    body: "No. CERN and independent scientists have reviewed the safety of LHC collisions and found no conceivable danger. Cosmic rays constantly strike Earth's atmosphere at energies higher than the LHC produces, so nature has already run the equivalent of many millions of LHC experiments and the planet is still here. The LHC does not create black holes that could pose any risk.",
    related: ['lhc', 'cern', 'antimatter'],
    tags: ['detector'],
  },
  {
    id: 'open-data',
    title: 'Open data',
    aliases: [
      'open data',
      'public data',
      'real data',
      'is this real data',
      'where does the data come from',
      'cern open data',
    ],
    body: 'The LHC experiments release real collision data publicly, for example through the CERN Open Data portal, so students and researchers outside the collaborations can look at genuine events. The ATLAS, CMS and LHCb events in the Phoenix demos come from such released data. The TrackML demo is different: it is simulated data from an imaginary detector, built for a tracking challenge.',
    related: ['event', 'masterclass', 'data-formats', 'physlite'],
    tags: ['data'],
  },
  {
    id: 'help',
    title: 'What you can ask',
    aliases: [
      'what can i ask',
      'what can you do',
      'what do you know',
      'help',
      'who are you',
      'what are you',
      'commands',
    ],
    body: 'You can ask me to DO things ("hide the calorimeter", "next event", "spin the detector", "dark mode"), or ask questions and I will explain: what something is ("what is a jet", "what is eta-phi"), how to use a feature ("how do I use the kinematics panel"), why something matters ("why do we use eta"), and where to find it ("where is the clipping button"). I cover Phoenix\'s features, particle-physics concepts, the detectors, and CERN and the LHC. I only answer from vetted information, so if I do not know something I will say so rather than guess.',
    related: ['command-palette', 'phoenix', 'masterclass'],
    tags: ['phoenix'],
  },
  // ---------------------------------------------------------------------------
  // Particles a student meets while reading an event, beyond the ones the
  // display labels directly. These come up constantly in masterclass questions
  // ("what actually made that track?") so the tutor should not be silent.
  // ---------------------------------------------------------------------------
  {
    id: 'pion',
    title: 'Pion',
    aliases: ['pion', 'pions', 'pi meson', 'charged pion'],
    body: 'A pion is the lightest hadron, made of a quark and an antiquark. Pions are by far the most common particles produced in LHC collisions, so most of the tracks you see in a busy event are charged pions. The neutral pion decays almost immediately into two photons, which show up as energy in the electromagnetic calorimeter rather than as a track.',
    why: 'Pions dominate the debris of a collision, so they are the background that interesting signals have to be picked out from. Knowing that most tracks are ordinary pions is what makes a clean pair of high-momentum muons look special.',
    related: ['hadron', 'track', 'jet', 'quark'],
    tags: ['physics'],
  },
  {
    id: 'kaon',
    title: 'Kaon',
    aliases: ['kaon', 'kaons', 'k meson', 'strange meson'],
    body: 'A kaon is a meson containing a strange quark or antiquark. Kaons live long enough to travel a measurable distance before decaying, so they can appear as a V shape: a neutral particle leaves no track, then two charged tracks appear together some distance from the collision point.',
    why: 'Kaons were where the difference between matter and antimatter was first seen experimentally, and their visible flight distance makes them a clear example of a particle decaying inside the detector rather than at the collision point.',
    related: ['hadron', 'vertex', 'cp-violation', 'quark'],
    tags: ['physics'],
  },
  {
    id: 'gluon',
    title: 'Gluon',
    aliases: ['gluon', 'gluons'],
    body: 'The gluon is the carrier of the strong force, the force that binds quarks into protons and neutrons. Gluons are massless and carry colour charge themselves, which means they interact with each other. A gluon is never seen on its own: it turns into a spray of hadrons, so what the detector records is a jet.',
    why: 'Because gluons interact with each other, the strong force does not fade with distance the way electromagnetism does. That is why quarks and gluons can never be pulled free and always appear as jets.',
    related: ['jet', 'quark', 'forces', 'hadron'],
    tags: ['physics'],
  },
  {
    id: 'neutron',
    title: 'Neutron',
    aliases: ['neutron', 'neutrons'],
    body: 'A neutron is a neutral particle made of three quarks (one up and two down), and along with the proton it makes up atomic nuclei. Being neutral it leaves no track in the tracker, so it is seen only once it showers in the calorimeters, mostly in the hadronic one.',
    related: ['proton', 'hadron', 'calorimeter', 'quark'],
    tags: ['physics'],
  },
  {
    id: 'positron',
    title: 'Positron',
    aliases: ['positron', 'positrons', 'anti electron', 'antielectron'],
    body: 'A positron is the antiparticle of the electron: identical mass, opposite (positive) charge. In the detector it looks like an electron, a track plus a shower in the electromagnetic calorimeter, except that the magnetic field bends it the other way.',
    why: 'The direction a track curves is how the detector measures charge, so an electron and a positron are told apart purely by which way they bend.',
    related: ['electron', 'antimatter', 'charge', 'magnetic-field'],
    tags: ['physics'],
  },
  {
    id: 'top-quark',
    title: 'Top quark',
    aliases: ['top quark', 'top quarks', 't quark'],
    body: 'The top quark is the heaviest known elementary particle, roughly as heavy as an entire gold atom despite being pointlike. It is so short-lived that it decays before it can form a hadron, almost always into a W boson and a bottom quark, so it is only ever seen through its decay products.',
    why: 'Its huge mass means the top quark couples most strongly to the Higgs field, which makes it a sensitive place to look for anything beyond the Standard Model.',
    related: ['quark', 'w-boson', 'bottom-quark', 'higgs-boson'],
    tags: ['physics'],
  },
  {
    id: 'bottom-quark',
    title: 'Bottom quark',
    aliases: ['bottom quark', 'b quark', 'beauty quark', 'b hadron', 'b jet'],
    body: 'The bottom quark forms hadrons that live long enough to travel a few millimetres before decaying. That short flight is visible: the tracks from the decay meet at a secondary vertex slightly displaced from the collision point, which is what lets a jet be identified as coming from a bottom quark.',
    related: ['b-tagging', 'vertex', 'jet', 'quark', 'lhcb'],
    tags: ['physics'],
  },
  // ---------------------------------------------------------------------------
  // How physicists actually reason about an event: identification, statistics
  // and simulation. These are the "why is that conclusion allowed?" questions.
  // ---------------------------------------------------------------------------
  {
    id: 'b-tagging',
    title: 'B-tagging',
    aliases: [
      'b tagging',
      'btag',
      'b tag',
      'flavour tagging',
      'flavor tagging',
    ],
    body: 'B-tagging is deciding whether a jet came from a bottom quark. Hadrons containing a bottom quark fly a small but measurable distance before decaying, so their tracks point back to a vertex displaced from the collision point rather than to the collision point itself. Finding that displaced vertex tags the jet.',
    why: 'Many interesting processes, top quark decays and one of the main Higgs decays among them, produce bottom quarks, so being able to pick those jets out of the far more common ordinary jets is what makes those measurements possible.',
    related: ['bottom-quark', 'vertex', 'impact-parameter', 'jet'],
    tags: ['physics'],
  },
  {
    id: 'impact-parameter',
    title: 'Impact parameter',
    aliases: [
      'impact parameter',
      'displaced track',
      'distance of closest approach',
    ],
    body: 'The impact parameter of a track is how close it comes to the collision point. Tracks from particles produced right at the collision point have a small impact parameter, while tracks from a particle that travelled before decaying miss the collision point by a visible amount.',
    related: ['vertex', 'b-tagging', 'track'],
    tags: ['physics'],
  },
  {
    id: 'isolation',
    title: 'Isolation',
    aliases: ['isolation', 'isolated lepton', 'isolated', 'non isolated'],
    body: 'A lepton is called isolated when there is little other activity around it. Electrons and muons produced directly by a W or Z boson come out on their own, while leptons produced inside hadron decays are surrounded by the rest of the jet. Requiring isolation is therefore a simple and powerful way to select the interesting ones.',
    why: 'It is one of the main handles that separates a genuine boson decay from the far more common leptons made inside jets, which is exactly the choice a masterclass student is making by eye.',
    related: ['muon', 'electron', 'jet', 'signal-background'],
    tags: ['physics'],
  },
  {
    id: 'jet-algorithm',
    title: 'Jet algorithms',
    aliases: [
      'jet algorithm',
      'anti kt',
      'antikt',
      'jet clustering',
      'jet radius',
      'cone size',
    ],
    body: "A jet is not something the detector measures directly, it is the result of grouping nearby energy deposits together. A jet algorithm does that grouping, with a radius parameter setting how wide a jet is. The algorithms used at the LHC are built so that the answer does not change if a particle radiates a soft or collinear extra particle, which is what makes the result theoretically comparable with predictions. Phoenix does not run any of this: it draws the jets that the experiment's reconstruction had already built before the file was written.",
    related: ['jet', 'gluon', 'calorimeter'],
    tags: ['physics'],
  },
  {
    id: 'cross-section',
    title: 'Cross-section',
    aliases: ['cross section', 'crosssection', 'probability of a process'],
    body: 'A cross-section measures how likely a given process is when particles collide. It has units of area, and multiplying it by the total luminosity collected over a period gives the expected number of those events. Interesting processes have tiny cross-sections compared with ordinary collisions, which is why so many collisions are needed.',
    related: ['luminosity', 'signal-background', 'branching-ratio'],
    tags: ['physics'],
  },
  {
    id: 'branching-ratio',
    title: 'Branching ratio',
    aliases: ['branching ratio', 'branching fraction', 'decay fraction'],
    body: 'A particle can usually decay in several different ways, and the branching ratio is the fraction of the time it takes a particular one. Some rare decay modes are studied anyway because they are far easier to see: the Higgs decay into four leptons happens very rarely, but it is so clean that it was one of the channels used to discover it.',
    related: ['decay', 'higgs-boson', 'signal-background'],
    tags: ['physics'],
  },
  {
    id: 'significance',
    title: 'Statistical significance (sigma)',
    aliases: [
      'significance',
      'sigma',
      'five sigma',
      '5 sigma',
      'statistical significance',
    ],
    body: 'Significance says how unlikely it is that a bump in the data is just a random fluctuation of the background, quoted in standard deviations, or sigma. Particle physics conventionally calls three sigma evidence and five sigma a discovery. Five sigma is a deliberately demanding bar, because with so many collisions and so many places to look, mild fluctuations are guaranteed to occur somewhere.',
    why: 'It is the reason a single striking event never counts as a discovery: the claim has to be that the whole dataset cannot reasonably be explained by background alone.',
    related: ['signal-background', 'uncertainty', 'discovery', 'resonance'],
    tags: ['physics'],
  },
  {
    id: 'uncertainty',
    title: 'Uncertainty (statistical and systematic)',
    aliases: [
      'uncertainty',
      'error bar',
      'error bars',
      'systematic uncertainty',
      'statistical uncertainty',
      'margin of error',
    ],
    body: 'A measurement has two kinds of uncertainty. Statistical uncertainty comes from having a finite number of events and shrinks as more data is collected. Systematic uncertainty comes from how well the detector and the theory are understood, for example the calibration of the energy scale, and more data alone does not reduce it.',
    related: ['significance', 'reconstruction', 'monte-carlo'],
    tags: ['physics'],
  },
  {
    id: 'monte-carlo',
    title: 'Simulated events (Monte Carlo)',
    aliases: ['monte carlo', 'simulated events', 'simulated data', 'generator'],
    body: 'Physicists produce large samples of simulated collisions: the physics of the collision is generated from theory, and then the resulting particles are tracked through a detailed model of the detector to produce the same kind of output as real data. Comparing real data against simulation is how backgrounds are estimated and how the detector response is understood.',
    why: 'It is the only way to know what the data should look like if a signal is absent, which is what any claim of an excess is measured against.',
    related: ['signal-background', 'reconstruction', 'uncertainty'],
    tags: ['physics'],
  },
  {
    id: 'feynman-diagram',
    title: 'Feynman diagram',
    aliases: ['feynman diagram', 'feynman diagrams', 'feynman'],
    body: 'A Feynman diagram is a shorthand picture of a particle interaction, with lines for particles and vertices where they meet. It is a bookkeeping device for a calculation rather than a photograph of what happens: the lines are not the paths particles take through space.',
    related: ['forces', 'decay', 'is-this-a-photo'],
    tags: ['physics'],
  },
  {
    id: 'conservation-laws',
    title: 'Conservation laws',
    aliases: [
      'conservation',
      'conservation law',
      'conserved',
      'conservation of energy',
      'conservation of momentum',
    ],
    body: 'Certain quantities are the same before and after a collision or decay: energy, momentum, and electric charge among them. These rules are what make it possible to infer something that was never detected, which is exactly how an invisible neutrino is deduced from momentum that does not balance.',
    related: ['missing-energy', 'neutrino', 'invariant-mass', 'charge'],
    tags: ['physics'],
  },
  {
    id: 'spin',
    title: 'Spin',
    aliases: [
      'spin',
      'spin of a particle',
      'particle spin',
      'intrinsic angular momentum',
    ],
    body: 'Spin is an intrinsic form of angular momentum that a particle carries. Its value divides particles into two families: fermions, the matter particles, have half-integer spin, while bosons have whole-number spin. The Higgs boson is the one fundamental particle with zero spin.',
    related: ['fermion', 'boson', 'higgs-boson', 'particle'],
    tags: ['physics'],
  },
  {
    id: 'cp-violation',
    title: 'CP violation',
    aliases: [
      'cp violation',
      'matter antimatter asymmetry',
      'why is there more matter',
    ],
    body: 'CP violation is a small difference in how matter and antimatter behave. It matters because the Big Bang should have made equal amounts of both, which would have left nothing behind, and yet the universe is made of matter. The amount of CP violation seen so far is not nearly enough to explain that, which is one reason it is still studied closely, particularly at LHCb.',
    related: ['antimatter', 'lhcb', 'kaon', 'dark-matter'],
    tags: ['physics'],
  },
  {
    id: 'supersymmetry',
    title: 'Supersymmetry',
    aliases: [
      'supersymmetry',
      'susy',
      'sparticles',
      'beyond the standard model',
    ],
    body: 'Supersymmetry is a proposed extension of the Standard Model in which every known particle has a heavier partner. It is attractive because it would tidy up several theoretical problems and could supply a dark matter candidate. No supersymmetric particle has been found, and LHC searches have ruled out large parts of the simpler versions.',
    related: ['standard-model', 'dark-matter', 'limits', 'missing-energy'],
    tags: ['physics'],
  },
  {
    id: 'quark-gluon-plasma',
    title: 'Quark-gluon plasma',
    aliases: [
      'quark gluon plasma',
      'qgp',
      'heavy ion',
      'heavy ion collisions',
      'lead lead collisions',
    ],
    body: 'When lead nuclei are collided instead of protons, the energy density is high enough that quarks and gluons are briefly no longer confined inside individual hadrons, forming a state called the quark-gluon plasma. It is thought to be the state the universe was in microseconds after the Big Bang, and ALICE is the LHC experiment built to study it.',
    related: ['alice', 'quark', 'gluon', 'hadron'],
    tags: ['physics'],
  },
  // ---------------------------------------------------------------------------
  // The machine and the detector hardware. Students ask about these as soon as
  // they wonder where the events they are looking at actually came from.
  // ---------------------------------------------------------------------------
  {
    id: 'injector-chain',
    title: 'How protons reach the LHC',
    aliases: [
      'injector chain',
      'injectors',
      'linac',
      'proton source',
      'where do the protons come from',
      'how do protons get into the lhc',
      'how are protons accelerated',
      'accelerator complex',
    ],
    body: 'Protons are not injected straight into the LHC. They start as hydrogen gas, are stripped of their electrons, and then pass through a chain of progressively larger accelerators, each handing the beam to the next at a higher energy, before the LHC takes them to their final energy. The smaller machines in the chain are older accelerators that were once the flagship experiments themselves.',
    related: ['lhc', 'accelerator', 'beam', 'lhc-energy'],
    tags: ['physics'],
  },
  {
    id: 'dipole-magnets',
    title: 'LHC magnets',
    aliases: [
      'dipole',
      'dipoles',
      'dipole magnets',
      'lhc magnets',
      'superconducting magnets',
      'how does the lhc bend the beam',
    ],
    body: 'The LHC keeps its beams on a circular path with over a thousand superconducting dipole magnets. To carry the necessary current without resistance they are cooled with superfluid helium to below 2 kelvin, colder than outer space, which makes the LHC one of the coldest large volumes in the universe while it is running.',
    why: 'The strength of the bending field is what limits the beam energy for a ring of a given size, so magnet technology, not the tunnel, is the real constraint on collision energy.',
    related: ['lhc', 'accelerator', 'magnetic-field', 'beam'],
    tags: ['physics'],
  },
  {
    id: 'bunch',
    title: 'Bunches and bunch crossings',
    aliases: [
      'bunch',
      'bunches',
      'bunch crossing',
      'how often do collisions happen',
      'collision rate',
    ],
    body: 'The beams are not continuous streams, they are split into bunches of protons separated by a fixed gap. Bunches cross inside the experiments tens of millions of times a second, and each crossing produces dozens of separate proton-proton collisions at once. That rate is why a trigger is needed: only a small fraction of crossings can ever be recorded.',
    related: ['beam', 'pileup', 'trigger', 'luminosity'],
    tags: ['physics'],
  },
  {
    id: 'hl-lhc',
    title: 'High-Luminosity LHC',
    aliases: ['hl lhc', 'high luminosity lhc', 'hllhc', 'lhc upgrade', 'run 4'],
    body: 'The High-Luminosity LHC is the upgrade the machine is being rebuilt for during the current long shutdown. It will deliver many more collisions per crossing, which means far more data for rare processes, and also far more pileup for the detectors and the reconstruction software to cope with. First high-luminosity operation is currently targeted for 2030.',
    why: 'More collisions is the only way to reach processes too rare to see so far, but it also makes every event vastly more crowded, which is what drives the detector and computing upgrades happening now.',
    related: ['lhc-status', 'pileup', 'luminosity', 'lhc'],
    tags: ['physics'],
  },
  {
    id: 'tracker',
    title: 'Tracking detector',
    aliases: [
      'tracker',
      'tracking detector',
      'inner detector',
      'pixel detector',
      'silicon detector',
      'inner tracker',
    ],
    body: 'The tracking detector is the innermost layer, wrapped closely around the beam pipe. It is built from finely segmented silicon that records a hit wherever a charged particle passes, without absorbing it. Joining those hits gives the particle path, and because the whole tracker sits in a magnetic field, the curvature of that path gives the momentum and the sign of the charge.',
    why: 'It is the only part of the detector that measures a particle without destroying it, and the only one that sees exactly where a particle came from, which is what makes finding vertices possible.',
    related: ['track', 'hit', 'vertex', 'magnetic-field', 'detector'],
    tags: ['detector'],
  },
  {
    id: 'muon-spectrometer',
    title: 'Muon system',
    aliases: [
      'muon spectrometer',
      'muon system',
      'muon chambers',
      'muon detector',
    ],
    body: 'The muon system is the outermost layer of the detector. Almost everything else has been stopped by the calorimeters by that point, so a track that reaches the outside is very likely a muon. Measuring the muon again out there, far from the collision point, gives a second independent measurement of its momentum, which is combined with the tracker measurement. The outer measurement matters most for the very highest-momentum muons, whose tracks are almost straight in the tracker.',
    related: ['muon', 'detector', 'calorimeter', 'track'],
    tags: ['detector'],
  },
  // ---------------------------------------------------------------------------
  // CERN, the collaborations, and the software ecosystem Phoenix belongs to.
  // ---------------------------------------------------------------------------
  {
    id: 'collaboration',
    title: 'Who works on the experiments',
    aliases: [
      'collaboration',
      'how many people work on atlas',
      'physicists',
      'how many scientists',
    ],
    body: 'Each of the large LHC experiments is run by a collaboration of thousands of people from hundreds of institutes across dozens of countries. Nobody builds or analyses one of these detectors alone: the detector, the software, the calibration and the analysis are all shared work, and results are published under the whole collaboration name.',
    related: ['cern', 'atlas', 'cms', 'hsf'],
    tags: ['physics'],
  },
  {
    id: 'www',
    title: 'The web was invented at CERN',
    aliases: [
      'world wide web',
      'www',
      'who invented the web',
      'internet at cern',
      'web invented at cern',
    ],
    body: 'The World Wide Web began at CERN as a proposal for sharing documents between physicists working in different places. CERN later put the software into the public domain, which is a large part of why the web grew as it did. Phoenix running in a browser is a small continuation of that: the tools are built to be opened by anyone with a link, not installed.',
    related: ['cern', 'phoenix', 'open-data'],
    tags: ['hsf'],
  },
  {
    id: 'grid-computing',
    title: 'How LHC data is processed',
    aliases: [
      'grid',
      'grid computing',
      'wlcg',
      'computing',
      'where is the data stored',
      'how much data does the lhc produce',
    ],
    body: 'The LHC produces far more data than any single computing centre could handle, so processing is spread over a worldwide network of computing centres that share storage and processing. Data recorded at CERN is distributed outward, and physicists run their analyses wherever there is capacity rather than where the data happens to sit.',
    related: ['trigger', 'open-data', 'cern', 'hsf'],
    tags: ['hsf'],
  },
  {
    id: 'root',
    title: 'ROOT and JSROOT',
    aliases: ['root', 'root files', 'jsroot', 'root framework'],
    body: 'ROOT is the analysis framework most particle physics is done in, and the .root file is the standard way data is stored. JSROOT is its JavaScript counterpart, which is what lets a browser read those files directly. Phoenix uses JSROOT so that .root geometry can be loaded without any conversion step.',
    related: ['data-formats', 'geometry-formats', 'import-export', 'hsf'],
    tags: ['hsf'],
  },
  {
    id: 'geant4',
    title: 'Detector simulation',
    aliases: [
      'geant',
      'geant4',
      'detector simulation',
      'how is the detector simulated',
    ],
    body: 'Simulated collisions are only useful if the detector response is modelled too. The LHC experiments do this with Geant4, a software toolkit for simulating how particles pass through matter: generated particles are tracked step by step through a detailed description of the detector material, recording what they would have deposited. The output looks like real data and goes through the same reconstruction, which is what makes the comparison meaningful.',
    related: ['monte-carlo', 'reconstruction', 'detector'],
    tags: ['physics'],
  },
  {
    id: 'ippog',
    title: 'Who runs the masterclasses',
    aliases: [
      'ippog',
      'who runs masterclasses',
      'international masterclasses',
      'outreach',
    ],
    body: 'The International Masterclasses are organised by IPPOG, the International Particle Physics Outreach Group, together with the experiments, and run every year at universities and research institutes. Students spend a day working with real measurements from the LHC and then join a video link with other groups to combine their results, which is close to how a real collaboration works.',
    related: ['masterclass', 'cern', 'open-data'],
    tags: ['physics'],
  },
  {
    id: 'event-displays',
    title: 'Other event displays',
    aliases: [
      'other event displays',
      'event display software',
      'how is phoenix different',
      'alternatives to phoenix',
    ],
    body: 'Most experiments have their own event display, usually written for that experiment and often needing an installation. Phoenix takes the opposite approach: it is experiment-agnostic, runs in a browser, and is developed in the open under the HEP Software Foundation, so several experiments can share one display instead of each maintaining its own.',
    related: ['phoenix', 'hsf', 'experiment-info'],
    tags: ['hsf'],
  },
  {
    id: 'histogram',
    title: 'Histograms and mass peaks',
    aliases: ['histogram', 'histograms', 'histogram panel', 'mass histogram'],
    body: 'A histogram counts how many events fall into each range of a quantity. It is the step that turns single events into a measurement: no one event proves anything, but plotting the invariant mass of many events makes a particle show up as a peak standing above a smooth background. Phoenix has a histogram panel that builds one as a class works, drawn with JSROOT as a real ROOT histogram: by default invariant mass from 20 to 120 GeV in 50 bins, marking 91.2 GeV so a Z peak is easy to pick out, with the entry count and mean shown alongside.',
    howto:
      'Open the histogram panel from the iconbar. It starts empty and fills as you tag particles in the masterclass panel, one entry per result you record. The count and mean update as it fills, and what you have collected is kept in the browser so it survives a reload.',
    why: "A single event tells you very little. A particle shows up as a bump in a distribution built from many events, so pooling everyone's measurements into one histogram is what makes a resonance such as the Z visible at all.",
    where:
      'The histogram panel button in the iconbar (enabled in the masterclass setup).',
    related: [
      'invariant-mass',
      'resonance',
      'signal-background',
      'masterclass',
    ],
    tags: ['physics'],
  },
  // ---------------------------------------------------------------------------
  // Practical questions about running Phoenix itself.
  // ---------------------------------------------------------------------------
  {
    id: 'screenshot-mode',
    title: 'Screenshot mode',
    aliases: [
      'screenshot mode',
      'fullscreen',
      'full screen',
      'hide the menus',
      'presentation mode',
      'clean view',
    ],
    body: 'Screenshot mode makes Phoenix fill the screen and hides the surrounding menus, leaving just the event. It is useful for projecting during a class or for capturing a clean image without the interface in the way.',
    howto:
      'Choose screenshot mode under the make picture button in the iconbar. Leaving fullscreen returns the menus.',
    where: 'Screenshot options, under the make picture button in the iconbar.',
    related: ['screenshot', 'iconbar', 'masterclass'],
    tags: ['phoenix'],
  },
  {
    id: 'browser-support',
    title: 'What Phoenix needs to run',
    aliases: [
      'browser support',
      'requirements',
      'which browser',
      'does it work on my computer',
      'system requirements',
      'webgl',
    ],
    body: 'Phoenix runs in any current desktop browser with hardware-accelerated 3D graphics, which is the normal default. Nothing has to be installed and no account is needed. Very large events are limited mostly by the graphics hardware, so an older laptop will still work but will render fewer objects smoothly.',
    related: ['performance-mode', 'phoenix', 'vr-ar'],
    tags: ['phoenix'],
  },
  {
    id: 'source-code',
    title: 'Phoenix is open source',
    aliases: [
      'source code',
      'github',
      'open source',
      'licence',
      'license',
      'can i contribute',
      'where is the code',
    ],
    body: 'Phoenix is developed in the open under the HEP Software Foundation and released under the Apache 2.0 licence, so anyone can read the code, run it, or contribute. Experiments configure it for their own data rather than forking it, which is what keeps one display usable by several collaborations.',
    related: ['hsf', 'phoenix', 'event-displays'],
    tags: ['hsf'],
  },
  {
    id: 'slow-performance',
    title: 'If Phoenix feels slow',
    aliases: [
      'slow',
      'laggy',
      'low fps',
      'stuttering',
      'why is it slow',
      'why is phoenix slow',
      'performance problem',
      'freezing',
    ],
    body: 'Rendering speed depends on how much is on screen. Busy events with all the detector geometry and every collection visible are the heaviest case. Hiding geometry you are not looking at, turning off collections you do not need, and switching on performance mode all help, and performance mode is designed exactly for this.',
    howto:
      'Turn on performance mode, hide detector parts you are not using from the Phoenix menu, and switch off collections you are not looking at. Closing other heavy browser tabs also helps, since they share the same graphics hardware.',
    related: ['performance-mode', 'geometry-browser', 'phoenix-menu'],
    tags: ['phoenix'],
  },
  {
    id: 'event-selector',
    title: 'Event selector',
    aliases: [
      'event selector',
      'choose an event',
      'pick an event',
      'switch event',
      'change event',
      'event dropdown',
    ],
    body: 'The event selector is the dropdown listing the events in the file that is loaded. Picking one loads it into the view, so it is the quickest way to jump straight to a particular event rather than stepping through them in order.',
    howto:
      'Open the event dropdown in the iconbar and choose an event. To move through events in order instead, use the next and previous event controls.',
    where: 'The event dropdown in the iconbar.',
    related: ['cycle-events', 'event-browser', 'event'],
    tags: ['phoenix'],
  },
  {
    id: 'view-options',
    title: 'View options',
    aliases: [
      'view options',
      'view menu',
      'view tools',
      'view options and tools',
    ],
    body: 'The view options menu groups the controls that change how the scene is presented rather than what is in it: the preset camera views, the axis, the Cartesian and eta-phi grids, labels and the 3D measurement tools. It is the place to look when you want to change your viewpoint instead of the data.',
    howto:
      'Open the View options and Tools button in the iconbar. Tick Show Cartesian Grid, Show Eta Phi Grid, Show Axis, Show Labels, Show 3D Coordinates or Show 3D Distance to switch each one on, or click one of the preset views listed underneath to jump the camera to it.',
    where: 'The view options button in the iconbar.',
    related: ['preset-views', 'axis', 'overlay-view', 'iconbar'],
    tags: ['phoenix'],
  },
  {
    id: 'more-info',
    title: 'More info menu',
    aliases: ['more info', 'more information', 'extra info', 'info menu'],
    body: 'The more info menu collects the panels that show numbers rather than geometry, such as the kinematics of the selected objects and other per-event information. Grouping them keeps the main bar uncluttered while leaving the detail one click away.',
    howto:
      'Press the More Info button in the iconbar and tick the panels you want: Info Panel, Event Browser, Collections Info, Eta-Phi Panel, Geometry Browser or Track Kinematics. Each opens in its own window, and unticking it closes that window.',
    where: 'The more information button in the iconbar.',
    related: ['kinematics', 'info-panel', 'collections-info', 'iconbar'],
    tags: ['phoenix'],
  },
];
