import {
  CommandRegistry,
  registerDefaultCommands,
} from 'phoenix-event-display';
import { NaturalLanguageService } from './natural-language.service';

/**
 * AUTOMATIC KNOWLEDGE: a newly registered command must be explainable without
 * anyone writing an entry, and a REPLACED command must stop describing itself
 * with its old text.
 *
 * The second half is the subtle one. The registry replaces by name, so an
 * experiment overriding a command leaves the command COUNT unchanged; a cache
 * keyed on the count would keep answering with the description that is no
 * longer true.
 */
function makeService(registry: CommandRegistry): NaturalLanguageService {
  const svc = Object.create(
    NaturalLanguageService.prototype,
  ) as NaturalLanguageService;
  (svc as any).eventDisplay = { getCommandRegistry: () => registry };
  (svc as any).knowledgeCache = null;
  (svc as any).knowledgeSignature = '';
  (svc as any).knowledgeCacheSize = -1;
  return svc;
}

function registry(): CommandRegistry {
  const r = new CommandRegistry({
    eventDisplay: {},
    ui: {},
    three: {},
    state: {},
    emit: () => undefined,
    resolveObject: () => undefined,
    listGeometryParts: () => [],
  } as any);
  registerDefaultCommands(r);
  return r;
}

describe('the tutor learns new commands automatically', () => {
  it('explains a command registered after startup, with no curation', () => {
    const r = registry();
    const svc = makeService(r);
    expect((svc as any).tryAnswer('what is teleport camera')).toBeNull();

    r.register({
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

    const out = (svc as any).tryAnswer('what is teleport camera');
    expect(out).not.toBeNull();
    expect(out.answer.body).toContain('saved bookmark');
  });

  it('forgets the old description when a command is REPLACED', () => {
    const r = registry();
    r.register({
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
    const svc = makeService(r);
    expect(
      (svc as any).tryAnswer('what is teleport camera').answer.body,
    ).toContain('saved bookmark');

    // Same name, same command count, different behaviour.
    r.register({
      name: 'teleport-camera',
      title: 'Teleport camera',
      description:
        'Move the camera to the highest energy deposit in the event.',
      category: 'View',
      inputSchema: {
        type: 'object',
        properties: {},
        additionalProperties: false,
      },
      mutates: true,
      run: () => undefined,
    });

    const out = (svc as any).tryAnswer('what is teleport camera');
    expect(out.answer.body).toContain('highest energy deposit');
    expect(out.answer.body).not.toContain('saved bookmark');
  });

  it('does not rebuild when nothing changed (the cache still works)', () => {
    const r = registry();
    const svc = makeService(r);
    const first = (svc as any).knowledge();
    const second = (svc as any).knowledge();
    expect(second).toBe(first);
  });
});
