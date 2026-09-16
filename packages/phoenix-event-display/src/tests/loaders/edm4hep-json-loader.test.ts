/**
 * @jest-environment jsdom
 */
import { Edm4hepJsonLoader } from '../../loaders/edm4hep-json-loader';

describe('Edm4hepJsonLoader', () => {
  let loader: Edm4hepJsonLoader;

  beforeEach(() => {
    loader = new Edm4hepJsonLoader();
  });

  afterEach(() => {
    loader = undefined;
  });

  it('should create an instance', () => {
    expect(loader).toBeDefined();
  });

  it('should extract tracks from valid tracker hits', () => {
    const rawEventData = {
      event_1: {
        EventHeader: {
          collID: 1,
          collType: 'edm4hep::EventHeaderCollection',
          collection: [{ eventNumber: 101, runNumber: 1 }],
        },
        HitsCollection: {
          collID: 10,
          collType: 'edm4hep::TrackerHitCollection',
          collection: [
            { position: { x: 10, y: 20, z: 30 }, quality: 0 },
            { position: { x: 40, y: 50, z: 60 }, quality: 0 },
          ],
        },
        TracksCollection: {
          collID: 20,
          collType: 'edm4hep::TrackCollection',
          collection: [
            {
              chi2: 1.2,
              ndf: 10,
              trackerHits: [
                { collectionID: 10, index: 0 },
                { collectionID: 10, index: 1 },
              ],
              trackStates: [{ referencePoint: { x: 100, y: 200, z: 300 } }],
            },
          ],
        },
      },
    };

    loader.setRawEventData(rawEventData);
    loader.processEventData();
    const eventData = loader.getEventData()['event_1'];

    expect(eventData).toBeDefined();
    expect(eventData.Tracks['TracksCollection | other']).toBeDefined();
    const track = eventData.Tracks['TracksCollection | other'][0];
    expect(track.pos).toEqual([
      [1, 2, 3],
      [4, 5, 6],
    ]);
  });

  it('should fall back to track states if tracker hit collection cannot be found', () => {
    const rawEventData = {
      event_1: {
        EventHeader: {
          collID: 1,
          collType: 'edm4hep::EventHeaderCollection',
          collection: [{ eventNumber: 102, runNumber: 1 }],
        },
        TracksCollection: {
          collID: 20,
          collType: 'edm4hep::TrackCollection',
          collection: [
            {
              chi2: 0.8,
              ndf: 5,
              trackerHits: [{ collectionID: 999, index: 0 }],
              trackStates: [
                { referencePoint: { x: 100, y: 200, z: 300 } },
                { referencePoint: { x: 400, y: 500, z: 600 } },
              ],
            },
          ],
        },
      },
    };

    loader.setRawEventData(rawEventData);
    loader.processEventData();
    const eventData = loader.getEventData()['event_1'];

    expect(eventData).toBeDefined();
    expect(eventData.Tracks['TracksCollection | other']).toBeDefined();
    const track = eventData.Tracks['TracksCollection | other'][0];
    expect(track.pos).toEqual([
      [10, 20, 30],
      [40, 50, 60],
    ]);
  });

  it('should fall back to track states if tracker hit index is out of bounds', () => {
    const rawEventData = {
      event_1: {
        EventHeader: {
          collID: 1,
          collType: 'edm4hep::EventHeaderCollection',
          collection: [{ eventNumber: 103, runNumber: 1 }],
        },
        HitsCollection: {
          collID: 10,
          collType: 'edm4hep::TrackerHitCollection',
          collection: [{ position: { x: 10, y: 20, z: 30 }, quality: 0 }],
        },
        TracksCollection: {
          collID: 20,
          collType: 'edm4hep::TrackCollection',
          collection: [
            {
              chi2: 0.5,
              ndf: 4,
              trackerHits: [{ collectionID: 10, index: 999 }],
              trackStates: [{ referencePoint: { x: 50, y: 60, z: 70 } }],
            },
          ],
        },
      },
    };

    loader.setRawEventData(rawEventData);
    loader.processEventData();
    const eventData = loader.getEventData()['event_1'];

    expect(eventData).toBeDefined();
    const track = eventData.Tracks['TracksCollection | other'][0];
    expect(track.pos).toEqual([[5, 6, 7]]);
  });

  it('should extract tracks directly from track states when no tracker hits are present', () => {
    const rawEventData = {
      event_1: {
        EventHeader: {
          collID: 1,
          collType: 'edm4hep::EventHeaderCollection',
          collection: [{ eventNumber: 104, runNumber: 1 }],
        },
        TracksCollection: {
          collID: 20,
          collType: 'edm4hep::TrackCollection',
          collection: [
            {
              chi2: 1.0,
              ndf: 8,
              trackStates: [{ referencePoint: { x: 10, y: 20, z: 30 } }],
            },
          ],
        },
      },
    };

    loader.setRawEventData(rawEventData);
    loader.processEventData();
    const eventData = loader.getEventData()['event_1'];

    expect(eventData).toBeDefined();
    const track = eventData.Tracks['TracksCollection | other'][0];
    expect(track.pos).toEqual([[1, 2, 3]]);
  });

  it('should handle tracks with neither tracker hits nor track states gracefully', () => {
    const rawEventData = {
      event_1: {
        EventHeader: {
          collID: 1,
          collType: 'edm4hep::EventHeaderCollection',
          collection: [{ eventNumber: 105, runNumber: 1 }],
        },
        TracksCollection: {
          collID: 20,
          collType: 'edm4hep::TrackCollection',
          collection: [
            {
              chi2: 0,
              ndf: 0,
            },
          ],
        },
      },
    };

    loader.setRawEventData(rawEventData);
    expect(() => loader.processEventData()).not.toThrow();
    const eventData = loader.getEventData()['event_1'];
    expect(eventData).toBeDefined();
    const track = eventData.Tracks['TracksCollection | other'][0];
    expect(track.pos).toEqual([]);
  });
});
