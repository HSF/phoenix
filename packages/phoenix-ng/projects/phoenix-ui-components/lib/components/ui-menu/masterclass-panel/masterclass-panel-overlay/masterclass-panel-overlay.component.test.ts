import { MasterclassPanelOverlayComponent } from './masterclass-panel-overlay.component';

/**
 * Regression tests for #923: the "Select tracks" dropdown must list only
 * track-type collections (default), not detector-level collections such as
 * Hits (CSCs) or calo cells.
 */
describe('MasterclassPanelOverlayComponent collection filtering (#923)', () => {
  function makeComponent(
    grouped: { [type: string]: string[] },
    config?: any,
  ): MasterclassPanelOverlayComponent {
    const eventDisplay: any = {
      getCollections: jest.fn(() => grouped),
      getCollection: jest.fn(() => []),
      listenToDisplayedEventChange: jest.fn(() => jest.fn()),
      highlightObject: jest.fn(),
      emit: jest.fn(),
    };
    const component = new MasterclassPanelOverlayComponent(eventDisplay);
    if (config) component.config = config;
    return component;
  }

  it('shows only Tracks-type collections by default (drops CSCs / calo)', () => {
    const c = makeComponent({
      Hits: ['CSCs'],
      Tracks: ['Tracks_', 'CombinedMuonTracks'],
      CaloClusters: ['Clusters'],
    });
    (c as any).loadCollections();
    expect(c.collectionNames).toEqual(['Tracks_', 'CombinedMuonTracks']);
  });

  it('honors a custom collectionTypes config', () => {
    const c = makeComponent(
      { Tracks: ['Tracks_'], CaloClusters: ['Clusters'], Hits: ['CSCs'] },
      { collectionTypes: ['Tracks', 'CaloClusters'] },
    );
    (c as any).loadCollections();
    expect(c.collectionNames).toEqual(['Tracks_', 'Clusters']);
  });

  it('clears selection + items when no track collections exist', () => {
    const c = makeComponent({ Hits: ['CSCs'], CaloClusters: ['Clusters'] });
    c.selectedCollection = 'stale';
    (c as any).loadCollections();
    expect(c.collectionNames).toEqual([]);
    expect(c.selectedCollection).toBe('');
    expect(c.collectionItems).toEqual([]);
  });

  it('reselects the first collection when the prior selection disappears', () => {
    const c = makeComponent({ Tracks: ['Tracks_'] });
    c.selectedCollection = 'GoneCollection';
    (c as any).loadCollections();
    expect(c.selectedCollection).toBe('Tracks_');
  });
});

/**
 * The anchor click starts the download asynchronously, so revoking the object
 * URL in the same task can cancel it before the browser has taken its own
 * reference to the blob. `saveFile` defers the revoke for exactly this reason
 * (see helpers/file.ts); this panel must do the same.
 */
describe('MasterclassPanelOverlayComponent export', () => {
  const OBJECT_URL = 'blob:phoenix/masterclass';

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
   * Build a bare instance. `exportResults` only reads `massResults`, so
   * constructing through Angular DI is unnecessary.
   */
  function makeComponent(): MasterclassPanelOverlayComponent {
    const component: MasterclassPanelOverlayComponent = Object.create(
      MasterclassPanelOverlayComponent.prototype,
    );
    component.massResults = [{ eventType: 'Z', mass: 91188 }] as any;
    return component;
  }

  it('does not revoke the object URL synchronously', () => {
    const component = makeComponent();

    component.exportResults();

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    // Revoking here would cancel the download the click just started.
    expect(revokeObjectURL).not.toHaveBeenCalled();

    jest.runAllTimers();

    expect(revokeObjectURL).toHaveBeenCalledWith(OBJECT_URL);
  });

  it('does not create an object URL when there are no results', () => {
    const component = makeComponent();
    component.massResults = [];

    component.exportResults();
    jest.runAllTimers();

    expect(createObjectURL).not.toHaveBeenCalled();
    expect(revokeObjectURL).not.toHaveBeenCalled();
  });

  it('does not leave the temporary anchor in the document', () => {
    const component = makeComponent();

    component.exportResults();
    jest.runAllTimers();

    expect(document.querySelectorAll('a[download]')).toHaveLength(0);
  });
});
