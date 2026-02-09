/**
 * @jest-environment jsdom
 */
import { Group } from 'three';
import { InfoLogger } from '../../helpers/info-logger';
import { PhoenixLoader } from '../../loaders/phoenix-loader';
import { ThreeManager } from '../../managers/three-manager/index';
import { UIManager } from '../../managers/ui-manager/index';

jest.mock('../../managers/three-manager/index');

describe('PhoenixLoader', () => {
  let phoenixLoader: PhoenixLoader;
  let infoLogger: InfoLogger;
  let threeManager: ThreeManager;
  let uiManager: UIManager;

  // Example event data WITH time
  const eventData = {
    Event: {
      'event number': 1,
      'run number': 1,
      time: 500, // ns
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
      time: 1000, // ns
      Hits: {
        hitsCollection: [],
      },
    },
  };

  beforeEach(() => {
    phoenixLoader = new PhoenixLoader();

    infoLogger = new InfoLogger();
    threeManager = new ThreeManager(infoLogger);
    uiManager = new UIManager(threeManager);

    jest
      .spyOn(threeManager, 'addEventDataTypeGroup')
      .mockReturnValue(new Group());

    phoenixLoader.buildEventData(
      eventData.Event,
      threeManager,
      uiManager,
      infoLogger,
    );
  });

  afterEach(() => {
    phoenixLoader = undefined;
  });

  it('should create an instance', () => {
    expect(phoenixLoader).toBeTruthy();
  });

  it('should not get collections or collection when no event data is available', () => {
    phoenixLoader['eventData'] = undefined;

    const collections = phoenixLoader.getCollections();
    expect(collections).toEqual({});

    const collection = phoenixLoader.getCollection('hitsCollection');
    expect(collection).toBeFalsy();

    phoenixLoader['eventData'] = eventData.Event;
  });

  it('should get the list of event names from the event data', () => {
    const eventsList = phoenixLoader.getEventsList(eventData);

    expect(eventsList).toHaveLength(2);
    expect(eventsList[0]).toBe('Event');
    expect(eventsList[1]).toBe('Event2');
  });

  it('should get list of collections in the event data', () => {
    const collectionList = phoenixLoader.getCollections();

    expect(collectionList).toEqual({
      Hits: ['hitsCollection'],
    });
  });

  it('should get the collection with the given collection name from the event data', () => {
    const expectedCollection = eventData.Event.Hits.hitsCollection;
    const collection = phoenixLoader.getCollection('hitsCollection');

    expect(collection).toEqual(expectedCollection);
  });
});
