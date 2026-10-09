import * as fs from 'fs';
import * as path from 'path';
import { findKnowledge, KNOWLEDGE_BASE } from 'phoenix-event-display';

/**
 * FEATURE DRIFT GATE.
 *
 * The tutor answers questions about Phoenix, so it goes wrong quietly: someone
 * adds a panel, nobody writes an entry, and from then on the tutor confidently
 * knows nothing about part of the application a student is looking at. Nothing
 * else catches that, because the code compiles and every existing test passes.
 *
 * Commands describe themselves (their registered metadata is derived into an
 * entry), but a panel or menu is not a command, and that is where the gap sits.
 * This suite fails the build when a user-facing component has no explanation.
 *
 * It lives in phoenix-ng rather than beside the knowledge base, because the
 * core library is deliberately experiment- and UI-agnostic: it must not know
 * that an Angular component directory exists. The application knows its own
 * surface and asserts that the shared knowledge base covers it.
 *
 * The mapping is explicit rather than name-matched. A fuzzy name check passes
 * for the wrong reasons: "event-selector" resolved to the physics "trigger"
 * entry, which is a mis-answer a student would be misled by, and a name check
 * called that covered.
 */

/**
 * Component directory -> the entry that must explain it, and the wording a
 * STUDENT would actually use to ask about it.
 *
 * The asked phrase is given rather than derived from the directory name,
 * because directory names are developer vocabulary: nobody types "ss mode" or
 * "main view toggle". Deriving the question from the folder name would test
 * the wrong string and force junk aliases into the knowledge base to satisfy
 * it. Naming the real phrase also makes the gate meaningful for a new panel:
 * whoever adds it has to say how a student would ask, and prove that works.
 */
const FEATURE_TOPICS: Record<string, { topic: string; asked: string }> = {
  'animate-camera': { topic: 'animations', asked: 'camera animation' },
  'animate-event': { topic: 'animations', asked: 'collision animation' },
  'ar-toggle': { topic: 'vr-ar', asked: 'augmented reality' },
  'auto-rotate': { topic: 'auto-rotate', asked: 'auto rotate' },
  'collections-info': { topic: 'collections-info', asked: 'collections info' },
  'command-palette-toggle': {
    topic: 'command-palette',
    asked: 'command palette',
  },
  'cycle-events': { topic: 'cycle-events', asked: 'cycle events' },
  'dark-theme': { topic: 'dark-theme', asked: 'dark theme' },
  'eta-phi-panel': { topic: 'eta-phi', asked: 'eta phi panel' },
  'event-browser': { topic: 'event-browser', asked: 'event browser' },
  'event-data-explorer': {
    topic: 'event-data-explorer',
    asked: 'event data explorer',
  },
  'event-selector': { topic: 'event-selector', asked: 'event selector' },
  'experiment-info': { topic: 'experiment-info', asked: 'experiment info' },
  'geometry-browser': { topic: 'geometry-browser', asked: 'geometry browser' },
  'histogram-panel': { topic: 'histogram', asked: 'histogram panel' },
  'info-panel': { topic: 'info-panel', asked: 'info panel' },
  'io-options': { topic: 'import-export', asked: 'import and export' },
  'kinematics-panel': { topic: 'kinematics', asked: 'kinematics panel' },
  'main-view-toggle': { topic: 'projection', asked: 'orthographic view' },
  'make-picture': { topic: 'screenshot', asked: 'screenshot' },
  'masterclass-panel': { topic: 'masterclass', asked: 'masterclass' },
  'more-info': { topic: 'more-info', asked: 'more info' },
  'object-clipping': { topic: 'clipping', asked: 'clipping' },
  'object-selection': { topic: 'object-selection', asked: 'object selection' },
  overlay: { topic: 'overlay-view', asked: 'overlay view' },
  'overlay-view': { topic: 'overlay-view', asked: 'overlay view' },
  'performance-toggle': {
    topic: 'performance-mode',
    asked: 'performance mode',
  },
  'share-link': { topic: 'share-link', asked: 'share link' },
  'ss-mode': { topic: 'screenshot-mode', asked: 'screenshot mode' },
  'tree-menu': { topic: 'phoenix-menu', asked: 'phoenix menu' },
  'view-options': { topic: 'view-options', asked: 'view options' },
  'vr-toggle': { topic: 'vr-ar', asked: 'virtual reality' },
  'zoom-controls': { topic: 'zoom', asked: 'zoom' },
};

/**
 * Components that are plumbing rather than features. A student never asks about
 * these, so an entry would be noise. Listed explicitly so that adding a real
 * feature cannot be waved through by accident.
 */
const NOT_A_FEATURE = new Set([
  'menu-toggle',
  'notification-toast',
  'ui-menu-wrapper',
]);

/**
 * How-to questions for each mapped feature that do not reach its topic. A null
 * hit is a miss, not a pass.
 */
function howToMisses(
  topics: Record<string, { topic: string; asked: string }>,
  find: (q: string) => { id: string } | null,
): string[] {
  const wrong: string[] = [];
  for (const [, { topic, asked }] of Object.entries(topics)) {
    const q = `how do i use the ${asked}`;
    const hit = find(q);
    if (hit?.id !== topic) {
      wrong.push(`"${q}" -> ${hit?.id ?? 'no answer'} (want ${topic})`);
    }
  }
  return wrong;
}

const uiMenuDir = path.resolve(__dirname, '../components/ui-menu');

function componentDirs(): string[] {
  return fs
    .readdirSync(uiMenuDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

describe('knowledge coverage: the tutor keeps up with the UI', () => {
  it('every user-facing component is either mapped to a topic or declared plumbing', () => {
    const undeclared = componentDirs().filter(
      (name) => !(name in FEATURE_TOPICS) && !NOT_A_FEATURE.has(name),
    );
    // A new panel lands here. Either write an entry and map it, or say plainly
    // that it is not something a student would ask about.
    expect(undeclared).toEqual([]);
  });

  it('every mapped topic exists in the knowledge base', () => {
    const ids = new Set(KNOWLEDGE_BASE.map((e) => e.id));
    const dangling = Object.entries(FEATURE_TOPICS)
      .filter(([, { topic }]) => !ids.has(topic))
      .map(([component, { topic }]) => `${component} -> ${topic}`);
    expect(dangling).toEqual([]);
  });

  it('asking about a feature the way a student would reaches the right topic', () => {
    // The mapping above is only worth having if retrieval actually honours it.
    const wrong: string[] = [];
    for (const [, { topic, asked }] of Object.entries(FEATURE_TOPICS)) {
      const hit = findKnowledge(`what is the ${asked}`) ?? findKnowledge(asked);
      if (hit?.id !== topic) {
        wrong.push(`"${asked}" -> ${hit?.id ?? 'no answer'} (want ${topic})`);
      }
    }
    expect(wrong).toEqual([]);
  });

  it('and so does asking how to use it', () => {
    // A student asking "how do I use X" must not fall off the map either.
    // Falling off includes getting NO answer: the old check skipped a null hit,
    // so a feature the tutor could not answer at all counted as covered.
    expect(howToMisses(FEATURE_TOPICS, (q) => findKnowledge(q))).toEqual([]);
  });

  it('NEGATIVE CONTROL: the how-to check counts a missing answer as a miss', () => {
    // Stands in for a retrieval regression that stops answering how-to
    // questions entirely (the exact case the old null-skip waved through).
    const sample = { 'kinematics-panel': FEATURE_TOPICS['kinematics-panel'] };
    expect(howToMisses(sample, () => null)).toEqual([
      '"how do i use the kinematics panel" -> no answer (want kinematics)',
    ]);
    // And a wrong topic is still a miss.
    expect(howToMisses(sample, () => ({ id: 'jet' }))).toEqual([
      '"how do i use the kinematics panel" -> jet (want kinematics)',
    ]);
  });

  it('the mapping does not point at stale components', () => {
    const dirs = new Set(componentDirs());
    const gone = Object.keys(FEATURE_TOPICS).filter((c) => !dirs.has(c));
    expect(gone).toEqual([]);
  });
});
