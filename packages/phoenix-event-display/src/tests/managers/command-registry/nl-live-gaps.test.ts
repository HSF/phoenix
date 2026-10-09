import { keywordFallback } from '../../../managers/command-registry/nl-intent';
import { findKnowledge } from '../../../managers/command-registry/knowledge-base';

/**
 * Gaps found by driving the REAL running application, not by reasoning about
 * the code. Each of these is a phrasing a student actually produces that the
 * live run answered wrongly or not at all, so each gets a test before it gets
 * a fix.
 */

describe('live gaps: stating a target must not toggle away from it', () => {
  it('"switch to orthographic" asks for orthographic, not for a flip', () => {
    // A toggle is wrong for a stated target: saying it twice, or saying it when
    // already orthographic, took the student OUT of orthographic. It matters
    // doubly for the agent bridge, where an external caller repeating a
    // tools/call must not undo its own request.
    const out = keywordFallback('switch to orthographic');
    expect(out?.command).toBe('toggle-camera-projection');
    expect(out?.args).toEqual({ orthographic: true });
  });

  it('"switch to perspective" asks for perspective', () => {
    const out = keywordFallback('switch to perspective');
    expect(out?.command).toBe('toggle-camera-projection');
    expect(out?.args).toEqual({ orthographic: false });
  });

  it('a bare "toggle the projection" still just flips', () => {
    // No target stated, so a flip is exactly what was asked for.
    const out = keywordFallback('toggle the camera projection');
    expect(out?.command).toBe('toggle-camera-projection');
    expect(out?.args).toEqual({});
  });
});

describe('live gaps: preset views work without a model', () => {
  // The keyword path used to decline every "go to the <name> view" because it
  // could not know the preset names. A student without WebGPU therefore had no
  // way to reach a preset view by asking. The live names are already resolved
  // for the model prompt, so the matcher can be given them too.
  const VIEWS = ['Left View', 'Center View', 'Right View', 'Transverse View'];

  it('"go to the left view" reaches that preset', () => {
    const out = keywordFallback('go to the left view', { presetViews: VIEWS });
    expect(out).toEqual({
      command: 'preset-view',
      args: { view: 'Left View' },
    });
  });

  it('"rotate to the transverse view" is a camera move, not a spin', () => {
    const out = keywordFallback('rotate to the transverse view', {
      presetViews: VIEWS,
    });
    expect(out).toEqual({
      command: 'preset-view',
      args: { view: 'Transverse View' },
    });
  });

  it('"snap to centre view" tolerates the other spelling', () => {
    const out = keywordFallback('snap to the center view', {
      presetViews: VIEWS,
    });
    expect(out?.command).toBe('preset-view');
    expect(out?.args).toEqual({ view: 'Center View' });
  });

  it('still declines a view name that does not exist', () => {
    // Inventing a preset would be worse than saying nothing.
    expect(
      keywordFallback('go to the banana view', { presetViews: VIEWS }),
    ).toBeNull();
  });

  it('spinning still wins when no view is named', () => {
    expect(
      keywordFallback('spin the detector', { presetViews: VIEWS })?.command,
    ).toBe('toggle-auto-rotate');
    expect(
      keywordFallback('rotate the detector', { presetViews: VIEWS })?.command,
    ).toBe('toggle-auto-rotate');
  });

  it('works when the caller has no view list at all', () => {
    expect(keywordFallback('go to the left view')).toBeNull();
  });
});

describe('live gaps: phrasings a student actually used', () => {
  it('"let me look inside" turns clipping on', () => {
    // How a student asks to see into the detector, and already the wording of
    // the clipping topic itself.
    expect(keywordFallback('let me look inside')).toEqual({
      command: 'set-clipping',
      args: { on: true },
    });
  });

  it('"where is the clipping button" is answered', () => {
    expect(findKnowledge('where is the clipping button')?.id).toBe('clipping');
  });

  it('"how do protons get into the lhc" is answered', () => {
    expect(findKnowledge('how do protons get into the lhc')?.id).toBe(
      'injector-chain',
    );
  });

  it('"why is phoenix slow" is answered', () => {
    expect(findKnowledge('why is phoenix slow')?.id).toBe('slow-performance');
  });

  it('"what is spin" explains the physics, not the spin button', () => {
    // A question is routed to the tutor, and in a physics tutor "spin" is the
    // particle property. The auto-rotate feature keeps the word for COMMANDS
    // ("spin the detector"), which never reach this path.
    expect(findKnowledge('what is spin')?.id).toBe('spin');
    expect(findKnowledge('what is particle spin')?.id).toBe('spin');
  });

  it('still treats "spin the detector" as the command it is', () => {
    expect(keywordFallback('spin the detector')?.command).toBe(
      'toggle-auto-rotate',
    );
  });

  it('declines a histogram question about another program', () => {
    // Phoenix does not plot histograms and knows nothing about Excel.
    expect(findKnowledge('how do i plot a histogram in excel')).toBeNull();
  });
});

describe('live gaps: geometry parts by their real names', () => {
  // Same problem as preset views: part names differ per experiment, so the
  // matcher can only use them when the caller supplies the live ones. Without
  // this a student on the keyword path could not hide anything by name.
  const PARTS = ['Beam', 'LAr HEC', 'SCT', 'Pixel', 'Muon Spectrometer'];

  it('"hide the beam" hides that part', () => {
    expect(keywordFallback('hide the beam', { geometryParts: PARTS })).toEqual({
      command: 'set-geometry-visibility',
      args: { part: 'Beam', visible: false },
    });
  });

  it('"show the pixel detector" shows it', () => {
    const out = keywordFallback('show the pixel', { geometryParts: PARTS });
    expect(out).toEqual({
      command: 'set-geometry-visibility',
      args: { part: 'Pixel', visible: true },
    });
  });

  it('matches a multi-word part name', () => {
    const out = keywordFallback('hide the muon spectrometer', {
      geometryParts: PARTS,
    });
    expect(out?.args).toEqual({ part: 'Muon Spectrometer', visible: false });
  });

  it('does not invent a part that is not in the scene', () => {
    expect(
      keywordFallback('hide the flux capacitor', { geometryParts: PARTS }),
    ).toBeNull();
  });

  it('leaves other commands alone', () => {
    expect(
      keywordFallback('hide the axes', { geometryParts: PARTS })?.command,
    ).toBe('show-axis');
  });
});

describe('live gaps: zoom phrasings that are not the word zoom', () => {
  it('"get closer" zooms in', () => {
    expect(keywordFallback('get closer')).toEqual({
      command: 'zoom',
      args: { direction: 'in' },
    });
  });

  it('"move further away" zooms out', () => {
    expect(keywordFallback('move further away')).toEqual({
      command: 'zoom',
      args: { direction: 'out' },
    });
  });
});

describe('live gaps: negation and precedence bugs found in the browser', () => {
  it('"turn off dark mode" switches to light, it does not turn dark ON', () => {
    // The theme branch ignored negation entirely, so asking to turn dark mode
    // OFF turned it on. Found by driving the real app: the phrase reached
    // set-theme and the page stayed dark.
    expect(keywordFallback('turn off dark mode')).toEqual({
      command: 'set-theme',
      args: { dark: false },
    });
  });

  it('"turn off light mode" switches to dark', () => {
    expect(keywordFallback('turn off light mode')).toEqual({
      command: 'set-theme',
      args: { dark: true },
    });
  });

  it('plain requests still work', () => {
    expect(keywordFallback('dark mode')?.args).toEqual({ dark: true });
    expect(keywordFallback('light mode')?.args).toEqual({ dark: false });
  });

  it('"go back to perspective" is a camera request, not event navigation', () => {
    // "go back" alone matched previous-event, so a projection request walked
    // the student to a different event instead.
    expect(keywordFallback('go back to perspective')).toEqual({
      command: 'toggle-camera-projection',
      args: { orthographic: false },
    });
  });

  it('"go back" still means the previous event when that is the subject', () => {
    expect(keywordFallback('go back an event')?.command).toBe('previous-event');
    expect(keywordFallback('go back to the previous event')?.command).toBe(
      'previous-event',
    );
  });

  it('covers the remaining event-navigation phrasings', () => {
    expect(keywordFallback('go forward one event')?.command).toBe('next-event');
    expect(keywordFallback('the event before')?.command).toBe('previous-event');
    expect(keywordFallback('the event after this one')?.command).toBe(
      'next-event',
    );
  });
});
