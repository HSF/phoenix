/**
 * @jest-environment jsdom
 */
import { EventDisplay } from '../../../event-display';

/**
 * The command host advertised NO geometry parts, which had two consequences
 * found by driving the live application:
 *
 *   1. the `part` argument's enum was empty, so an agent reading tools/list had
 *      nothing to choose from and had to guess a name;
 *   2. the validation that refuses an unknown part was skipped entirely, so
 *      hiding a part that does not exist reported success and did nothing.
 *
 * The names have to come from the live scene rather than a fixed list, because
 * ATLAS, CMS, LHCb and TrackML all have different detectors.
 */
function fakeScene(tree: Record<string, string[]>) {
  const children = Object.entries(tree).map(([name, kids]) => ({
    name,
    children: kids.map((k) => ({ name: k, children: [] })),
  }));
  return { children };
}

function displayWith(tree: Record<string, string[]>): EventDisplay {
  const display = Object.create(EventDisplay.prototype) as EventDisplay;
  (display as any).getThreeManager = () => ({
    getSceneManager: () => ({ getGeometries: () => fakeScene(tree) }),
  });
  return display;
}

describe('geometry part names come from the live scene', () => {
  it('lists the top level and one level below it', () => {
    const display = displayWith({
      'Inner Detector': ['Pixel', 'SCT'],
      Calorimeter: ['LAr Barrel'],
    });
    expect(display.getGeometryPartNames().sort()).toEqual([
      'Calorimeter',
      'Inner Detector',
      'LAr Barrel',
      'Pixel',
      'SCT',
    ]);
  });

  it('drops unnamed nodes and duplicates', () => {
    const display = displayWith({ Beam: ['Beam', ''] });
    expect(display.getGeometryPartNames()).toEqual(['Beam']);
  });

  it('returns an empty list when there is no geometry yet', () => {
    const display = Object.create(EventDisplay.prototype) as EventDisplay;
    (display as any).getThreeManager = () => ({
      getSceneManager: () => ({ getGeometries: () => undefined }),
    });
    expect(display.getGeometryPartNames()).toEqual([]);
  });

  it('never throws, whatever state the scene is in', () => {
    const display = Object.create(EventDisplay.prototype) as EventDisplay;
    (display as any).getThreeManager = () => {
      throw new Error('not ready');
    };
    expect(display.getGeometryPartNames()).toEqual([]);
  });

  it('is bounded, so a huge detector tree cannot bloat a tool schema', () => {
    const tree: Record<string, string[]> = {};
    for (let i = 0; i < 500; i++) tree[`Part ${i}`] = [`Sub ${i}`];
    expect(displayWith(tree).getGeometryPartNames().length).toBeLessThanOrEqual(
      120,
    );
  });
});
