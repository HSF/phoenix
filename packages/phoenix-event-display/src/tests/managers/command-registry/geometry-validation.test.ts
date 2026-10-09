import { CommandRegistry } from '../../../managers/command-registry/command-registry';
import { registerDefaultCommands } from '../../../managers/command-registry/default-commands';
import type { CommandHost } from '../../../managers/command-registry/command-host';

/**
 * A command that silently succeeds on input it did not act on is the worst
 * failure mode for an agent-facing API: the caller is told it worked and moves
 * on. Found live, where hiding a part that does not exist returned ok and
 * changed nothing.
 */
function reg(parts: string[], seen: string[]): CommandRegistry {
  const r = new CommandRegistry({
    eventDisplay: {},
    ui: {
      geometryVisibility: (part: string) => seen.push(part),
    },
    three: {},
    state: {},
    emit: () => undefined,
    resolveObject: () => undefined,
    listGeometryParts: () => parts,
  } as unknown as CommandHost);
  registerDefaultCommands(r);
  return r;
}

describe('set-geometry-visibility validates the part', () => {
  it('acts on a real part', async () => {
    const seen: string[] = [];
    const out = await reg(['Beam', 'Pixel'], seen).execute(
      'set-geometry-visibility',
      { part: 'Beam', visible: false },
    );
    expect(out.ok).toBe(true);
    expect(seen).toEqual(['Beam']);
  });

  it('refuses a part that is not in the scene, and does not act', async () => {
    const seen: string[] = [];
    const out = await reg(['Beam', 'Pixel'], seen).execute(
      'set-geometry-visibility',
      { part: 'Flux Capacitor', visible: false },
    );
    expect(out.ok).toBe(false);
    expect(seen).toEqual([]);
  });

  it('names what it would have accepted, so the caller can correct itself', async () => {
    const out = await reg(['Beam', 'Pixel'], []).execute(
      'set-geometry-visibility',
      { part: 'Flux Capacitor', visible: false },
    );
    // Asserted on the whole result, which is how the rest of this suite reads
    // an error without fighting the union's narrowing.
    expect(out).toMatchObject({ ok: false });
    expect(JSON.stringify(out)).toContain('Flux Capacitor');
    expect(JSON.stringify(out)).toContain('Beam');
  });

  it('stays permissive when the experiment exposes no part list', async () => {
    // Some configurations cannot enumerate parts. Refusing everything there
    // would break the command for them, so it passes through unchanged.
    const seen: string[] = [];
    const out = await reg([], seen).execute('set-geometry-visibility', {
      part: 'Whatever',
      visible: true,
    });
    expect(out.ok).toBe(true);
    expect(seen).toEqual(['Whatever']);
  });

  it('matches case-insensitively, since the name is spoken not typed', async () => {
    const seen: string[] = [];
    const out = await reg(['LAr HEC'], seen).execute(
      'set-geometry-visibility',
      { part: 'lar hec', visible: false },
    );
    expect(out.ok).toBe(true);
    // Resolved to the real name the scene uses.
    expect(seen).toEqual(['LAr HEC']);
  });
});
