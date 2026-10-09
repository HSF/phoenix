import { CommandRegistry } from '../../../managers/command-registry/command-registry';
import { registerDefaultCommands } from '../../../managers/command-registry/default-commands';
import type { CommandHost } from '../../../managers/command-registry/command-host';
import {
  KNOWLEDGE_BASE,
  deriveCommandEntries,
  findKnowledge,
} from '../../../managers/command-registry/knowledge-base';

/**
 * KNOWLEDGE FRESHNESS.
 *
 * A curated knowledge base goes stale the moment someone adds a feature and
 * forgets to describe it, and a tutor that silently does not know about half
 * the application is worse than one that admits ignorance. Two mechanisms keep
 * it honest:
 *
 *   1. Commands describe THEMSELVES. Every registered command already carries a
 *      title, description and category (reviewed when the command is added), so
 *      an entry is derived from that metadata. A new command is explainable the
 *      moment it is registered, with no separate curation step and no way for
 *      the description and the answer to disagree.
 *   2. A drift gate. Anything the derivation cannot cover has to be curated,
 *      and this suite fails when it is not. The repo already gates on
 *      documentation coverage (compodoc --coverageTest 100), so failing a build
 *      for missing knowledge is the established convention here.
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

describe('knowledge freshness: new commands explain themselves', () => {
  it('derives an entry for a command the curated base has never heard of', () => {
    const registry = reg();
    registry.register({
      name: 'teleport-camera',
      title: 'Teleport camera',
      description: 'Move the camera instantly to a saved bookmark.',
      category: 'View',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      mutates: true,
      run: () => undefined,
    });

    const derived = deriveCommandEntries(registry.list());
    const entry = derived.find((e) => e.id === 'command:teleport-camera');

    expect(entry).toBeDefined();
    // The answer is the developer's own description, so it cannot drift away
    // from what the command actually does.
    expect(entry!.body).toContain(
      'Move the camera instantly to a saved bookmark',
    );
    expect(entry!.title).toBe('Teleport camera');
    // It is runnable straight from the answer.
    expect(entry!.action?.command).toBe('teleport-camera');
  });

  it('a brand-new command is findable through the normal tutor path', () => {
    const registry = reg();
    registry.register({
      name: 'teleport-camera',
      title: 'Teleport camera',
      description: 'Move the camera instantly to a saved bookmark.',
      category: 'View',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      mutates: true,
      run: () => undefined,
    });
    const kb = [...KNOWLEDGE_BASE, ...deriveCommandEntries(registry.list())];

    expect(findKnowledge('what is teleport camera', kb)?.id).toBe(
      'command:teleport-camera',
    );
  });

  it('does not shadow a curated entry that already covers the topic', () => {
    // "Clipping" is a curated physics/UI concept with a proper explanation and
    // how-to. The derived one-liner must not displace it.
    const kb = [...KNOWLEDGE_BASE, ...deriveCommandEntries(reg().list())];
    expect(findKnowledge('what is clipping', kb)?.id).toBe('clipping');
  });

  it("DRIFT GATE: every registered command is explainable in a student's words", () => {
    // Fails the build when a command exists that neither the curated base nor
    // the derivation can describe, which is how a stale tutor is caught before
    // a student meets it.
    //
    // Deliberately NOT a lookup of the command's own title: a derived entry
    // lists that title among its aliases, so a title lookup is close to
    // self-satisfying and passes for any sane title. It was checked: with a
    // title-only gate, a command called "Fit" or "Histogram panel" sailed
    // through purely on its own manufactured alias. Real questions are asked
    // in sentences, so the gate asks in sentences.
    const registry = reg();
    const kb = [...KNOWLEDGE_BASE, ...deriveCommandEntries(registry.list())];
    const unexplained: string[] = [];
    for (const command of registry.list()) {
      const name = command.title ?? command.name;
      const phrasings = [
        `what is ${name}`,
        `what does ${name} do`,
        `how do i ${name}`,
      ];
      const answered = phrasings.filter((q) => findKnowledge(q, kb) !== null);
      if (answered.length !== phrasings.length) {
        const missed = phrasings.filter((q) => findKnowledge(q, kb) === null);
        unexplained.push(
          `${command.name}: unanswered ${JSON.stringify(missed)}`,
        );
      }
    }
    expect(unexplained).toEqual([]);
  });

  it('VETTING BOUNDARY: a derived answer never carries an unreviewed physics claim', () => {
    // A derived entry restates a DEVELOPER's command description verbatim.
    // Command descriptions are reviewed as code, not as physics, so this is the
    // one path by which text nobody vetted for physics could reach a student.
    // Keeping derived text purely operational is what preserves the promise
    // that every physics statement in the tutor was written and reviewed as
    // physics. If a command genuinely needs to explain physics, the
    // explanation belongs in a curated entry, which is reviewed as such.
    const PHYSICS_CLAIM =
      /\b(quark|boson|higgs|lepton|hadron|neutrino|decays?|antimatter|relativis\w+|invariant mass|standard model|gev|tev|luminosity|cross.section|pseudorapidity)\b/i;
    const offenders: string[] = [];
    for (const entry of deriveCommandEntries(reg().list())) {
      const text = [entry.body, entry.howto, entry.why, entry.where]
        .filter(Boolean)
        .join(' ');
      const claim = text.match(PHYSICS_CLAIM);
      if (claim) offenders.push(`${entry.id}: "${claim[0]}"`);
    }
    expect(offenders).toEqual([]);
  });

  it('every derived entry is operational text, not an explanation of physics', () => {
    // The positive half of the boundary: a derived entry must tell the student
    // how to RUN something, which is exactly what command metadata can be
    // trusted to describe.
    for (const entry of deriveCommandEntries(reg().list())) {
      expect(entry.howto).toMatch(/command palette/i);
      expect(entry.body.length).toBeGreaterThan(40);
    }
  });

  it('NEGATIVE CONTROL: the vetting boundary actually fires', () => {
    // A gate that cannot fail is worse than no gate, because it reads as
    // protection. This registers exactly the mistake the boundary exists to
    // catch (a developer explaining physics in a command description) and
    // proves the check rejects it.
    const registry = reg();
    registry.register({
      name: 'show-higgs-candidates',
      title: 'Show Higgs candidates',
      description:
        'Highlight events where two leptons give an invariant mass near the Higgs boson.',
      category: 'Physics',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      mutates: true,
      run: () => undefined,
    });
    const PHYSICS_CLAIM =
      /\b(quark|boson|higgs|lepton|hadron|neutrino|decays?|antimatter|relativis\w+|invariant mass|standard model|gev|tev|luminosity|cross.section|pseudorapidity)\b/i;
    const derived = deriveCommandEntries(registry.list()).find(
      (e) => e.id === 'command:show-higgs-candidates',
    );
    expect(derived).toBeDefined();
    expect(PHYSICS_CLAIM.test(derived!.body)).toBe(true);
  });

  it('NEGATIVE CONTROL: the drift gate actually fires on an unexplainable command', () => {
    // The old gate looked up the command's own title, which a derived entry
    // lists as its own alias, so it passed for anything. Proving the new gate
    // fails on a command a student could not ask about is what shows the
    // difference is real and not cosmetic.
    const registry = reg();
    registry.register({
      // A name made only of stopwords: nothing distinctive to retrieve on.
      name: 'do-it',
      title: 'Do it',
      description: 'Performs the configured action for the current view.',
      category: 'View',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      mutates: true,
      run: () => undefined,
    });
    const kb = [...KNOWLEDGE_BASE, ...deriveCommandEntries(registry.list())];
    expect(findKnowledge('what is Do it', kb)?.id).not.toBe('command:do-it');
  });

  it('DRIFT GATE: every command carries the metadata the derivation needs', () => {
    for (const command of reg().list()) {
      expect(typeof command.description).toBe('string');
      expect(command.description.length).toBeGreaterThan(15);
      expect(typeof command.category).toBe('string');
    }
  });
});
