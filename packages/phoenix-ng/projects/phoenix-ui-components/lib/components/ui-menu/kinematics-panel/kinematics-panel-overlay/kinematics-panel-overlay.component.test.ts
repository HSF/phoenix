/**
 * @jest-environment jsdom
 */
import { KinematicsPanelOverlayComponent } from './kinematics-panel-overlay.component';

/**
 * The anchor click starts the download asynchronously, so revoking the object
 * URL in the same task can cancel it before the browser has taken its own
 * reference to the blob. `saveFile` defers the revoke for exactly this reason
 * (see helpers/file.ts); this panel must do the same.
 */
describe('KinematicsPanelOverlayComponent export', () => {
  const OBJECT_URL = 'blob:phoenix/kinematics';

  const originalCreate = (URL as any).createObjectURL;
  const originalRevoke = (URL as any).revokeObjectURL;

  let createObjectURL: jest.Mock;
  let revokeObjectURL: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    createObjectURL = jest.fn().mockReturnValue(OBJECT_URL);
    revokeObjectURL = jest.fn();
    // jsdom does not implement the object URL APIs.
    (URL as any).createObjectURL = createObjectURL;
    (URL as any).revokeObjectURL = revokeObjectURL;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    (URL as any).createObjectURL = originalCreate;
    (URL as any).revokeObjectURL = originalRevoke;
  });

  /**
   * Build a bare instance. `exportTSV` only touches `rows`, `config.columns`
   * and `selectedCollection`, so constructing through Angular DI is
   * unnecessary.
   */
  function makeComponent(): KinematicsPanelOverlayComponent {
    const component: KinematicsPanelOverlayComponent = Object.create(
      KinematicsPanelOverlayComponent.prototype,
    );
    component.rows = [
      { uuid: 'a', values: { pt: 10 } },
      { uuid: 'b', values: { pt: 20 } },
    ] as any;
    component.config = {
      columns: [{ id: 'pt', label: 'pT', unit: 'GeV', precision: 1 }],
    } as any;
    component.selectedCollection = 'Tracks';
    return component;
  }

  it('does not revoke the object URL synchronously', () => {
    const component = makeComponent();

    component.exportTSV();

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    // Revoking here would cancel the download the click just started.
    expect(revokeObjectURL).not.toHaveBeenCalled();

    jest.runAllTimers();

    expect(revokeObjectURL).toHaveBeenCalledWith(OBJECT_URL);
  });

  it('revokes every object URL it creates', () => {
    const component = makeComponent();

    component.exportTSV();
    component.exportTSV();
    jest.runAllTimers();

    expect(createObjectURL).toHaveBeenCalledTimes(2);
    expect(revokeObjectURL).toHaveBeenCalledTimes(2);
  });

  it('does not leave the temporary anchor in the document', () => {
    const component = makeComponent();

    component.exportTSV();
    jest.runAllTimers();

    expect(document.querySelectorAll('a[download]')).toHaveLength(0);
  });
});
