/**
 * @jest-environment jsdom
 */
import { EventDisplay } from '../../../event-display';
import { resolveEnumSources } from '../../../managers/command-registry/enum-sources';

/**
 * Live values for the `enumSource` parameters (collection, view, eventKey,
 * part). tools/list and the natural-language layer both advertise these as the
 * allowed values, so a wrong list means an agent is told a real name is invalid
 * or has to guess one.
 */
describe('resolveEnumSources', () => {
  it('lists collection NAMES (the values), not the event-data type keys', () => {
    // getCollections() is keyed by TYPE ("Tracks"); getCollection(name) only
    // resolves the real collection names. Advertising the keys was a real bug.
    const out = resolveEnumSources({
      getCollections: () => ({
        Tracks: ['CombinedInDetTracks', 'MuonSpectrometerTracks'],
        Jets: ['AntiKt4EMTopoJets'],
      }),
    });
    expect(out.collections).toEqual([
      'CombinedInDetTracks',
      'MuonSpectrometerTracks',
      'AntiKt4EMTopoJets',
    ]);
    expect(out.collections).not.toContain('Tracks');
    expect(out.collections).not.toContain('Jets');
  });

  it('reads preset view names, event keys and geometry parts from the display', () => {
    const out = resolveEnumSources({
      getUIManager: () => ({
        getPresetViews: () => [{ name: 'Left View' }, { name: 'Right View' }],
      }),
      getEventsData: () => ({ 'Run 1 Event 7': {}, 'Run 1 Event 9': {} }),
      getGeometryPartNames: () => ['Pixel', 'SCT'],
    });
    expect(out.presetViews).toEqual(['Left View', 'Right View']);
    expect(out.eventKeys).toEqual(['Run 1 Event 7', 'Run 1 Event 9']);
    expect(out.geometryParts).toEqual(['Pixel', 'SCT']);
  });

  it('always returns all four sources, empty when nothing is loaded', () => {
    const empty = {
      collections: [],
      presetViews: [],
      eventKeys: [],
      geometryParts: [],
    };
    expect(resolveEnumSources({})).toEqual(empty);
    expect(resolveEnumSources(undefined)).toEqual(empty);
    expect(resolveEnumSources(null)).toEqual(empty);
    expect(
      resolveEnumSources({
        getCollections: () => undefined,
        getUIManager: () => undefined,
        getEventsData: () => undefined,
        getGeometryPartNames: () => undefined as any,
      }),
    ).toEqual(empty);
  });

  it('never throws when a source throws, and keeps the sources that work', () => {
    const out = resolveEnumSources({
      getCollections: () => {
        throw new TypeError(
          "Cannot read properties of undefined ('eventDataLoader')",
        );
      },
      getUIManager: () => ({
        getPresetViews: () => {
          throw new Error('ui not ready');
        },
      }),
      getEventsData: () => ({ e1: {}, e2: {} }),
      getGeometryPartNames: () => {
        throw new Error('no scene');
      },
    });
    expect(out).toEqual({
      collections: [],
      presetViews: [],
      eventKeys: ['e1', 'e2'],
      geometryParts: [],
    });
  });

  it('drops duplicates and non-string or empty values, so every enum is valid JSON Schema', () => {
    const out = resolveEnumSources({
      getCollections: () =>
        ({ A: ['x', 'x', '', null], B: ['x', 'y', 7] }) as any,
      getUIManager: () => ({
        getPresetViews: () => [{ name: 'Front' }, {}, { name: 'Front' }] as any,
      }),
      getGeometryPartNames: () => ['Pixel', 42, 'Pixel'] as any,
    });
    expect(out.collections).toEqual(['x', 'y']);
    expect(out.presetViews).toEqual(['Front']);
    expect(out.geometryParts).toEqual(['Pixel']);
  });

  it('works on a real EventDisplay that has not been initialised yet', () => {
    // No configuration, no UI manager, no scene: exactly the state tools/list
    // can be asked in while a page is still booting.
    const display = Object.create(EventDisplay.prototype) as EventDisplay;
    expect(() => resolveEnumSources(display)).not.toThrow();
    expect(resolveEnumSources(display)).toEqual({
      collections: [],
      presetViews: [],
      eventKeys: [],
      geometryParts: [],
    });
  });
});
