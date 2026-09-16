/**
 * @jest-environment jsdom
 */
import { SessionPillComponent } from './session-pill.component';

/**
 * The anchor click starts the download asynchronously, so revoking the object
 * URL in the same task can cancel it before the browser has taken its own
 * reference to the blob. `saveFile` defers the revoke for exactly this reason
 * (see helpers/file.ts); this component must do the same.
 */
describe('SessionPillComponent download', () => {
  const OBJECT_URL = 'blob:phoenix/session';

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
   * Build a bare instance. `onDownload` only reaches the session manager for
   * the blob, so constructing through Angular DI is unnecessary.
   */
  function makeComponent(blob: Blob | null): SessionPillComponent {
    const component: SessionPillComponent = Object.create(
      SessionPillComponent.prototype,
    );
    (component as any).sessionManager = {
      getDownloadBlob: jest.fn(() => blob),
    };
    return component;
  }

  it('does not revoke the object URL synchronously', () => {
    const component = makeComponent(new Blob(['{}']));

    component.onDownload();

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    // Revoking here would cancel the download the click just started.
    expect(revokeObjectURL).not.toHaveBeenCalled();

    jest.runAllTimers();

    expect(revokeObjectURL).toHaveBeenCalledWith(OBJECT_URL);
  });

  it('does not create an object URL when there is nothing recorded', () => {
    const component = makeComponent(null);

    component.onDownload();
    jest.runAllTimers();

    expect(createObjectURL).not.toHaveBeenCalled();
    expect(revokeObjectURL).not.toHaveBeenCalled();
  });

  it('does not leave the temporary anchor in the document', () => {
    const component = makeComponent(new Blob(['{}']));

    component.onDownload();
    jest.runAllTimers();

    expect(document.querySelectorAll('a[download]')).toHaveLength(0);
  });
});
