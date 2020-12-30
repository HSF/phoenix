import { CMSLoader } from '../loaders/cms-loader';
import { PhoenixLoader } from '../loaders/phoenix-loader';

describe('CMSLoader', () => {
  let cmsLoader: CMSLoader;
  const TEST_IG_ARCHIVE = 'https://raw.githubusercontent.com/HSF/phoenix/master/packages/phoenix-ng/projects/phoenix-app/src/assets/files/cms/EventData_test.ig';
  const TEST_EVENT_PATH = 'Run_202299/Event_876295434';
  const TEST_IG_ARCHIVE_TIMEOUT = 20000;

  it('should create CMS loader', () => {
    cmsLoader = new CMSLoader();
    expect(cmsLoader).toBeTruthy();
  });

  describe('methods depending upon event data', () => {
    beforeEach(() => {
      cmsLoader = new CMSLoader();
    });

    it('should read .ig archive without event path', (done) => {
      cmsLoader.readIgArchive(TEST_IG_ARCHIVE, (allEvents) => {
        expect(allEvents).toBeTruthy();
        done();
      });
    }, TEST_IG_ARCHIVE_TIMEOUT);

    it('should read .ig archive with event path', (done) => {
      cmsLoader.readIgArchive(TEST_IG_ARCHIVE, (allEvents) => {
        expect(allEvents).toBeTruthy();
        done();
      }, TEST_EVENT_PATH);
    }, TEST_IG_ARCHIVE_TIMEOUT);

    it('should load event data from .ig', () => {
      spyOn(cmsLoader, 'readIgArchive').and.callThrough();
      cmsLoader.loadEventDataFromIg(TEST_IG_ARCHIVE, TEST_EVENT_PATH, (eventData) => { });
      expect(cmsLoader.readIgArchive).toHaveBeenCalled();
    });

    it('should get all events data', (done) => {
      cmsLoader.readIgArchive(TEST_IG_ARCHIVE, (allEvents) => {
        const allEventsInPhnx = cmsLoader.getAllEventsData(allEvents);
        expect(allEventsInPhnx).toBeDefined();
        done();
      });
    }, TEST_IG_ARCHIVE_TIMEOUT);

    it('should apply max cut to event data', (done) => {
      cmsLoader.readIgArchive(TEST_IG_ARCHIVE, (allEvents) => {
        (cmsLoader as any).data = allEvents[0];
        const objectCollections = (cmsLoader as any).getObjectCollections(['PFJets_V1'], (object: any) => { }, [
          { attribute: 'et', max: 1 }
        ]);
        expect(objectCollections).toBeDefined();
        done();
      });
    }, TEST_IG_ARCHIVE_TIMEOUT);

    it('should load object types specific to CMS (MuonChambers)', (done) => {
      cmsLoader.readIgArchive(TEST_IG_ARCHIVE, (allEvents) => {
        (cmsLoader as any).data = allEvents[0];
        const eventData = cmsLoader.getEventData();

        // Mock call to parent PhoenixLoader method
        spyOn((PhoenixLoader.prototype as any), 'addObjectType').and.stub();

        (cmsLoader as any).loadObjectTypes(eventData);
        expect((PhoenixLoader.prototype as any).addObjectType).toHaveBeenCalled();

        eventData.MuonChambers = undefined;
        (cmsLoader as any).loadObjectTypes(eventData);
        done();
      });
    }, TEST_IG_ARCHIVE_TIMEOUT);

    it('should get event metadata', (done) => {
      cmsLoader.readIgArchive(TEST_IG_ARCHIVE, (allEvents) => {
        (cmsLoader as any).data = allEvents[0];
        (PhoenixLoader.prototype as any).eventData = cmsLoader.getEventData();
        expect(cmsLoader.getEventMetadata().length).toBeGreaterThan(0);

        // Removing "Orbit" metadata - this.data['Collections']['Event_V2'][0][3]
        (cmsLoader as any).data['Collections']['Event_V2'][0][3] = undefined;
        expect(cmsLoader.getEventMetadata().length).toBeGreaterThan(0);

        done();
      });
    }, TEST_IG_ARCHIVE_TIMEOUT);
  });

});
