import { CommandRegistry } from '../../../managers/command-registry/command-registry';
import { registerDefaultCommands } from '../../../managers/command-registry/default-commands';
import type { CommandHost } from '../../../managers/command-registry/command-host';

/**
 * Every command's HANDLER, exercised directly.
 *
 * These were previously only covered by the live browser harness, which meant a
 * regression in what a command actually DOES showed up only if someone
 * remembered to drive a browser. Coverage of default-commands.ts was 68% of
 * statements and 38% of branches, and both bugs found by driving the real app
 * (a toggle that ignored its argument, and a part name accepted without being
 * acted on) lived in exactly that gap.
 *
 * The host records calls, so each test asserts the command reached the right
 * API with the right values, not merely that it returned ok.
 */
interface Calls {
  [method: string]: any[][];
}

function makeHost(overrides: Partial<CommandHost> = {}): {
  host: CommandHost;
  calls: Calls;
} {
  const calls: Calls = {};
  const record =
    (name: string, result?: any) =>
    (...args: any[]) => {
      (calls[name] ??= []).push(args);
      return typeof result === 'function' ? result(...args) : result;
    };
  const host = {
    eventDisplay: {
      nextEvent: record('nextEvent'),
      previousEvent: record('previousEvent'),
      loadEvent: record('loadEvent'),
      zoomTo: record('zoomTo'),
      highlightObject: record('highlightObject'),
      lookAtObject: record('lookAtObject'),
      getCurrentEventKey: record('getCurrentEventKey', 'run/1'),
      getEventMetadata: record('getEventMetadata', [
        { label: 'Run', value: 1 },
      ]),
      getCollections: record('getCollections', { Tracks: [], Hits: [] }),
      getCollection: record('getCollection', () => [{ pT: 42, uuid: 'u1' }]),
    },
    ui: {
      setDarkTheme: record('setDarkTheme'),
      displayView: record('displayView'),
      setAutoRotate: record('setAutoRotate'),
      setClipping: record('setClipping'),
      setShowAxis: record('setShowAxis'),
      geometryVisibility: record('geometryVisibility'),
      getPresetViews: record('getPresetViews', [{ name: 'Left View' }]),
    },
    three: {
      revertMainCamera: record('revertMainCamera', true),
      isMainCameraOrthographic: record('isMainCameraOrthographic', false),
      setAutoRotate: record('setAutoRotate'),
    },
    state: {},
    emit: record('emit'),
    resolveObject: record('resolveObject', () => ({ uuid: 'u1' })),
    listGeometryParts: () => ['Beam', 'LAr HEC'],
    ...overrides,
  } as unknown as CommandHost;
  return { host, calls };
}

function reg(overrides: Partial<CommandHost> = {}) {
  const { host, calls } = makeHost(overrides);
  const registry = new CommandRegistry(host);
  registerDefaultCommands(registry);
  return { registry, calls, host };
}

describe('navigation handlers', () => {
  it('next-event advances', async () => {
    const { registry, calls } = reg();
    expect((await registry.execute('next-event', {})).ok).toBe(true);
    expect(calls.nextEvent).toHaveLength(1);
  });

  it('previous-event goes back', async () => {
    const { registry, calls } = reg();
    expect((await registry.execute('previous-event', {})).ok).toBe(true);
    expect(calls.previousEvent).toHaveLength(1);
  });

  it('load-event passes the key through', async () => {
    const { registry, calls } = reg();
    const out = await registry.execute('load-event', { eventKey: 'run/2' });
    expect(out.ok).toBe(true);
    expect(calls.loadEvent[0]).toEqual(['run/2']);
  });

  it('load-event refuses a non-string key', async () => {
    const { registry, calls } = reg();
    expect((await registry.execute('load-event', { eventKey: 7 })).ok).toBe(
      false,
    );
    expect(calls.loadEvent).toBeUndefined();
  });
});

describe('view handlers', () => {
  it('set-theme passes the requested mode, both ways', async () => {
    const { registry, calls } = reg();
    await registry.execute('set-theme', { dark: true });
    await registry.execute('set-theme', { dark: false });
    expect(calls.setDarkTheme).toEqual([[true], [false]]);
  });

  it('zoom in and out use reciprocal factors', async () => {
    const { registry, calls } = reg();
    await registry.execute('zoom', { direction: 'in' });
    await registry.execute('zoom', { direction: 'out' });
    const [zoomIn] = calls.zoomTo[0];
    const [zoomOut] = calls.zoomTo[1];
    expect(zoomIn).toBeLessThan(1);
    expect(zoomOut).toBeGreaterThan(1);
    // Symmetric, so zooming in then out returns to where you started.
    expect(zoomIn * zoomOut).toBeCloseTo(1, 5);
  });

  it('toggle-auto-rotate passes the requested state', async () => {
    const { registry, calls } = reg();
    await registry.execute('toggle-auto-rotate', { on: true });
    await registry.execute('toggle-auto-rotate', { on: false });
    const seen = (calls.setAutoRotate ?? []).map((a) => a[0]);
    expect(seen).toEqual([true, false]);
  });

  it('set-clipping passes the requested state', async () => {
    const { registry, calls } = reg();
    await registry.execute('set-clipping', { on: true });
    expect(calls.setClipping[0][0]).toBe(true);
  });

  it('show-axis passes the requested state', async () => {
    const { registry, calls } = reg();
    await registry.execute('show-axis', { show: false });
    expect(calls.setShowAxis[0][0]).toBe(false);
  });

  it('preset-view asks the UI for that view', async () => {
    const { registry, calls } = reg();
    const out = await registry.execute('preset-view', { view: 'Left View' });
    expect(out.ok).toBe(true);
    expect(JSON.stringify(calls.displayView[0])).toContain('Left View');
  });

  it('preset-view refuses a view that is not configured', async () => {
    const { registry, calls } = reg();
    const out = await registry.execute('preset-view', { view: 'Nope View' });
    expect(out.ok).toBe(false);
    expect(calls.displayView).toBeUndefined();
  });
});

/**
 * Run the registered projection command against a camera that really has a
 * state, counting flips. The host overrides `three`, so the shared recorder's
 * `calls.revertMainCamera` is never populated here; the old version of the
 * "differs" test asserted only `ok` for exactly that reason, and passed while a
 * stated target was mutated to never flip. The counter is local and real.
 */
async function projectionFlips(
  startOrthographic: boolean,
  args: Record<string, unknown>,
  mutate?: (registry: CommandRegistry) => void,
): Promise<{ ok: boolean; reverts: number; orthographic: boolean }> {
  let ortho = startOrthographic;
  let reverts = 0;
  const { registry } = reg({
    three: {
      revertMainCamera: () => {
        ortho = !ortho;
        reverts++;
        return ortho;
      },
      isMainCameraOrthographic: () => ortho,
    } as any,
  });
  mutate?.(registry);
  const out = await registry.execute('toggle-camera-projection', args);
  return { ok: out.ok, reverts, orthographic: ortho };
}

describe('camera projection is idempotent when a target is stated', () => {
  it('flips when no target is given', async () => {
    const { registry, calls } = reg();
    await registry.execute('toggle-camera-projection', {});
    expect(calls.revertMainCamera).toHaveLength(1);
  });

  it('flips when the current state differs from the request', async () => {
    // Both directions, each from the opposite state: exactly one flip, and the
    // camera ends up where it was asked to be.
    expect(await projectionFlips(false, { orthographic: true })).toEqual({
      ok: true,
      reverts: 1,
      orthographic: true,
    });
    expect(await projectionFlips(true, { orthographic: false })).toEqual({
      ok: true,
      reverts: 1,
      orthographic: false,
    });
  });

  it('NEGATIVE CONTROL: the flip check fails for a handler that ignores a differing target', async () => {
    // Stands in for the auditor's mutation: a stated target that never flips.
    // Registering by the same name replaces the real handler, so the check
    // above runs unchanged against the broken one and must see zero flips.
    const broken = await projectionFlips(false, { orthographic: true }, (r) => {
      const real = r.get('toggle-camera-projection')!;
      r.register({
        ...real,
        run: (a: any, h: any) =>
          typeof a.orthographic === 'boolean'
            ? a.orthographic
            : h.three.revertMainCamera(),
      });
    });
    expect(broken).not.toEqual({ ok: true, reverts: 1, orthographic: true });
    expect(broken.reverts).toBe(0);
  });

  it('does NOTHING when already in the requested state', async () => {
    let reverts = 0;
    const { registry } = reg({
      three: {
        revertMainCamera: () => {
          reverts++;
          return true;
        },
        isMainCameraOrthographic: () => true,
      } as any,
    });
    const out = await registry.execute('toggle-camera-projection', {
      orthographic: true,
    });
    expect(out.ok).toBe(true);
    // This is the bug that shipped: asking twice used to flip you back out.
    expect(reverts).toBe(0);
  });

  it('asking for the same thing twice is stable', async () => {
    let ortho = false;
    let reverts = 0;
    const { registry } = reg({
      three: {
        revertMainCamera: () => {
          ortho = !ortho;
          reverts++;
          return ortho;
        },
        isMainCameraOrthographic: () => ortho,
      } as any,
    });
    await registry.execute('toggle-camera-projection', { orthographic: true });
    await registry.execute('toggle-camera-projection', { orthographic: true });
    expect(ortho).toBe(true);
    expect(reverts).toBe(1);
  });
});

describe('geometry handler', () => {
  it('hides and shows a real part', async () => {
    const { registry, calls } = reg();
    await registry.execute('set-geometry-visibility', {
      part: 'Beam',
      visible: false,
    });
    expect(calls.geometryVisibility[0]).toEqual(['Beam', false]);
  });

  it('refuses an unknown part instead of reporting success', async () => {
    const { registry, calls } = reg();
    const out = await registry.execute('set-geometry-visibility', {
      part: 'Nope',
      visible: false,
    });
    expect(out.ok).toBe(false);
    expect(calls.geometryVisibility).toBeUndefined();
  });
});

describe('selection handlers', () => {
  it('highlight-object resolves the object first', async () => {
    const { registry, calls } = reg();
    const out = await registry.execute('highlight-object', {
      collection: 'Tracks',
      index: 0,
    });
    expect(out.ok).toBe(true);
    expect(calls.resolveObject[0]).toEqual(['Tracks', 0]);
    expect(calls.highlightObject[0]).toEqual(['u1']);
  });

  it('look-at-object resolves the object first', async () => {
    const { registry, calls } = reg();
    const out = await registry.execute('look-at-object', {
      collection: 'Tracks',
      index: 0,
    });
    expect(out.ok).toBe(true);
    expect(calls.lookAtObject[0]).toEqual(['u1']);
  });

  it('both refuse when the object cannot be resolved', async () => {
    const { registry, calls } = reg({ resolveObject: () => undefined });
    for (const name of ['highlight-object', 'look-at-object']) {
      const out = await registry.execute(name, {
        collection: 'Hits',
        index: 0,
      });
      expect(out.ok).toBe(false);
    }
    expect(calls.highlightObject).toBeUndefined();
    expect(calls.lookAtObject).toBeUndefined();
  });
});

describe('query handlers return data and are flagged read-only', () => {
  it('list-collections returns the collections', async () => {
    const { registry } = reg();
    const out = await registry.execute('list-collections', {});
    expect(out).toMatchObject({ ok: true });
    expect(JSON.stringify(out)).toContain('Tracks');
  });

  it('describe-event returns key and metadata', async () => {
    const { registry } = reg();
    const out = await registry.execute('describe-event', {});
    expect(JSON.stringify(out)).toContain('run/1');
    expect(JSON.stringify(out)).toContain('Run');
  });

  it('get-object returns the row', async () => {
    const { registry } = reg();
    const out = await registry.execute('get-object', {
      collection: 'Tracks',
      index: 0,
    });
    expect(JSON.stringify(out)).toContain('42');
  });

  it('every query command is declared non-mutating', () => {
    const { registry } = reg();
    for (const name of ['list-collections', 'describe-event', 'get-object']) {
      expect(registry.get(name)?.mutates).toBe(false);
    }
  });

  it('every other command is declared mutating', () => {
    const { registry } = reg();
    const queries = new Set([
      'list-collections',
      'describe-event',
      'get-object',
    ]);
    for (const command of registry.list()) {
      if (!queries.has(command.name)) {
        expect({ name: command.name, mutates: command.mutates }).toEqual({
          name: command.name,
          mutates: true,
        });
      }
    }
  });
});

describe('a handler that throws becomes a refused result, never an exception', () => {
  it('reports the failure instead of propagating', async () => {
    const { registry } = reg({
      eventDisplay: {
        nextEvent: () => {
          throw new Error('no more events');
        },
      } as any,
    });
    const out = await registry.execute('next-event', {});
    expect(out).toMatchObject({ ok: false });
    expect(JSON.stringify(out)).toContain('no more events');
  });
});
