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

  beforeEach(() => {
    phoenixLoader = new PhoenixLoader();
  });

  it('should create an instance', () => {
    expect(phoenixLoader).toBeTruthy();
  });

  it('should take an object that represents one event and add the different objects to the graphics library and the UI controls', () => {
    const eventData = [
      {
        'event number': 120,
        'run number': 111,
        pos: [
          -2545.135009765625, -2425.1064453125, 7826.09912109375,
          -2545.135009765625, -1.1222461462020874, 7826.09912109375,
        ],
        type: 'Line',
      },
    ];
    const graphicsLibrary = new ThreeManager(new InfoLogger());
    const uiManager = new UIManager(new ThreeManager(new InfoLogger()));
    const infoLogger = new InfoLogger();

    jest.spyOn(infoLogger, 'add');
    phoenixLoader.buildEventData(
      eventData,
      graphicsLibrary,
      uiManager,
      infoLogger
    );
    expect(infoLogger.add).toBeCalledTimes(1);
  });

  it('should get the list of event names from the event data', () => {
    const eventData = {
      event1: [
        {
          'event number': 120,
          'run number': 111,
          pos: [-2545.135009765625, -2425.1064453125, 7826.09912109375],
          type: 'Line',
        },
      ],
      event2: [
        {
          'event number': 121,
          'run number': 112,
          pos: [-2545.135009765625, -2425.1064453125, 7826.09912109375],
          type: 'Line',
        },
      ],
    };
    const eventList = phoenixLoader.getEventsList(eventData);
    expect(eventList).toHaveLength(2);
    expect(eventList[0]).toBe('event1');
    expect(eventList[1]).toBe('event2');
  });

  it('should get list of collections in the event data', () => {
    const collectionList = phoenixLoader.getCollections();
    expect(collectionList).toBe(null);
  });

  it('should get the collection with the given collection name from the event data', () => {
    const collectionName = 'Tracks_V3';
    const collection = phoenixLoader.getCollection(collectionName);
    expect(collection).toBeNull;
  });

  it('should add label of event object to the labels object', () => {
    const label = 'Track #1';
    const collection = 'Tracks_V3';
    const indexInCollection = 1;
    const addedLabel = phoenixLoader.addLabelToEventObject(
      label,
      collection,
      indexInCollection
    );
    expect(addedLabel).toBeUndefined;
  });

  it('should get the object containing labels of events', () => {
    const labelsObject = phoenixLoader.getLabelsObject();
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
