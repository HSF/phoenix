import { CMSLoader } from '../../loaders/cms-loader';
import { PhoenixLoader } from '../../loaders/phoenix-loader';

describe('CMSLoader', () => {
  let cmsLoader: CMSLoader;
  const TEST_IG_ARCHIVE = 'assets/EventData_test.ig';
  const TEST_EVENT_PATH = 'Run_202299/Event_876295434';
  const TEST_IG_ARCHIVE_TIMEOUT = 20000;

  describe('methods depending upon event data', () => {
    beforeAll((done) => {
      fetch(TEST_IG_ARCHIVE).then(async (res) => {
        const arrayBufferData = await res.arrayBuffer();
        spyOn(res, 'arrayBuffer').and.resolveTo(arrayBufferData);
        spyOn(window, 'fetch').and.resolveTo(res);
        done();
      });
    }, TEST_IG_ARCHIVE_TIMEOUT);

    beforeEach(() => {
      cmsLoader = new CMSLoader();
    });

    it('should read .ig archive without event path', () => {
      cmsLoader.readIgArchive(TEST_IG_ARCHIVE, (allEvents) => {
        expect(allEvents).toBeTruthy();
      });
    });

    it('should read .ig archive with event path', () => {
      cmsLoader.readIgArchive(
        TEST_IG_ARCHIVE,
        (allEvents) => {
          expect(allEvents).toBeTruthy();
        },
        TEST_EVENT_PATH
      );
    });

    it('should load event data from .ig', () => {
      spyOn(cmsLoader, 'readIgArchive').and.callThrough();
      cmsLoader.loadEventDataFromIg(
        TEST_IG_ARCHIVE,
        TEST_EVENT_PATH,
        (eventData) => {}
      );
      expect(cmsLoader.readIgArchive).toHaveBeenCalled();
    });

    it('should get all events data', () => {
      cmsLoader.readIgArchive(TEST_IG_ARCHIVE, (allEvents) => {
        const allEventsInPhnx = cmsLoader.getAllEventsData(allEvents);
        expect(allEventsInPhnx).toBeTruthy();
      });
    });

    it('should apply max cut to event data', () => {
      cmsLoader.readIgArchive(TEST_IG_ARCHIVE, (allEvents) => {
        (cmsLoader as any).data = allEvents[0];
        const objectCollections = (cmsLoader as any).getObjectCollections(
          ['PFJets_V1'],
          (object: any) => {},
          [{ attribute: 'et', max: 1 }]
        );
        expect(objectCollections).toBeTruthy();
      });
    });

    it('should load object types specific to CMS (MuonChambers)', () => {
      cmsLoader.readIgArchive(TEST_IG_ARCHIVE, (allEvents) => {
        (cmsLoader as any).data = allEvents[0];
        const eventData = cmsLoader.getEventData();

        // Mock call to parent PhoenixLoader method
        spyOn(PhoenixLoader.prototype as any, 'addObjectType').and.stub();

        (cmsLoader as any).loadObjectTypes(eventData);
        expect(
          (PhoenixLoader.prototype as any).addObjectType
        ).toHaveBeenCalled();

        eventData.MuonChambers = undefined;
        (cmsLoader as any).loadObjectTypes(eventData);
      });
    });

    it('should get event metadata', () => {
      cmsLoader.readIgArchive(TEST_IG_ARCHIVE, (allEvents) => {
        (cmsLoader as any).data = allEvents[0];
        (PhoenixLoader.prototype as any).eventData = cmsLoader.getEventData();
        expect(cmsLoader.getEventMetadata().length).toBeGreaterThan(0);

        // Removing "Orbit" metadata - this.data['Collections']['Event_V2'][0][3]
        (cmsLoader as any).data['Collections']['Event_V2'][0][3] = undefined;
        expect(cmsLoader.getEventMetadata().length).toBeGreaterThan(0);
      });
    });
  });
});
