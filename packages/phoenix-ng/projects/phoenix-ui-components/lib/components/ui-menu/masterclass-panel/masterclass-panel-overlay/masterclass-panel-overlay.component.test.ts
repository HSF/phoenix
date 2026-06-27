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
