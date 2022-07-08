/**
 * @jest-environment jsdom
 */
import { InfoLogger } from '../../helpers/info-logger';
import { PhoenixLoader } from '../../loaders/phoenix-loader';
import { ThreeManager } from '../../managers/three-manager/index';
import { UIManager } from '../../managers/ui-manager/index';

jest.mock('../../managers/three-manager/index');

describe('PhoenixLoader', () => {
  let phoenixLoader: PhoenixLoader;
  let eventData: any;

  beforeEach(() => {
    phoenixLoader = new PhoenixLoader();

    eventData = {
      Event: {
        'event number': 1,
        'run number': 1,
        Hits: {
          hitsCollection: [
            {
              pos: [
                -2545.135009765625, -2425.1064453125, 7826.09912109375,
                -2545.135009765625, -1.1222461462020874, 7826.09912109375,
              ],
              type: 'Line',
            },
          ],
        },
      },
      Event2: {
        'event number': 2,
        'run number': 2,
        Hits: {
          hitsCollection: [
            {
              pos: [
                -2545.135009765625, -2425.1064453125, 7826.09912109375,
                -2545.135009765625, -1.1222461462020874, 7826.09912109375,
              ],
              type: 'Line',
            },
          ],
        },
      },
    };

    const graphicsLibrary = new ThreeManager(new InfoLogger());
    const uiManager = new UIManager(new ThreeManager(new InfoLogger()));
    const infoLogger = new InfoLogger();

    phoenixLoader.buildEventData(
      eventData,
      graphicsLibrary,
      uiManager,
      infoLogger
    );
  });

  it('should create an instance', () => {
    expect(phoenixLoader).toBeTruthy();
  });

  it('should get the list of event names from the event data', () => {
    const eventsList = phoenixLoader.getEventsList(eventData);

    expect(eventsList).toHaveLength(2);
    expect(eventsList[0]).toBe('Event');
    expect(eventsList[1]).toBe('Event2');
  });

  it('should get list of collections in the event data', () => {
    const collectionList = phoenixLoader.getCollections();

    expect(collectionList).toEqual([
      'event number',
      'run number',
      'Hits',
      'event number',
      'run number',
      'Hits',
    ]);
  });

  it('should get the collection with the given collection name from the event data', () => {
    const collectionName = {
      hitsCollection: [
        {
          pos: [
            -2545.135009765625, -2425.1064453125, 7826.09912109375,
            -2545.135009765625, -1.1222461462020874, 7826.09912109375,
          ],
          type: 'Line',
        },
      ],
    };

    const collection = phoenixLoader.getCollection('Hits');

    expect(collection).toEqual(collectionName);
  });

  it('get metadata associated to any event', () => {
    const metadata = phoenixLoader.getEventMetadata();

    expect(metadata).toBeDefined();
  });

  it('should get the object containing labels of events', () => {
    const labelsObject = phoenixLoader.getLabelsObject();
    // as we didnt add labels for any
    expect(labelsObject).toBeNull;
  });

  it('should get function to add options to scale event object type by given factor', () => {
    const func = phoenixLoader.addScaleOptions(
      'configKey',
      'configLabel',
      () => {}
    );

    expect(func).toBeDefined;
  });
});
