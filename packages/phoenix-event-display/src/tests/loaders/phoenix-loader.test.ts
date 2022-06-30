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

  it('should take an object that represents ONE event and takes care of adding', () => {
    const eventData = {};
    const graphicsLibrary = new ThreeManager(new InfoLogger());
    const uiManager = new UIManager(new ThreeManager(new InfoLogger()));
    const infoLogger = new InfoLogger();

    jest.spyOn(phoenixLoader, 'buildEventData');
    phoenixLoader.buildEventData(
      eventData,
      graphicsLibrary,
      uiManager,
      infoLogger
    );
    expect(phoenixLoader.buildEventData).toHaveBeenCalled();
  });

  it('should get the list of event names from the event data', () => {
    const eventData = {
      events: [
        {
          name: 'event1',
          start: '2020-01-01T00:00:00.000Z',
          end: '2020-01-01T00:00:00.000Z',
        },
        {
          name: 'event2',
          start: '2020-01-01T00:00:00.000Z',
          end: '2020-01-01T00:00:00.000Z',
        },
      ],
    };
    jest.spyOn(phoenixLoader, 'getEventsList');
    phoenixLoader.getEventsList(eventData);
    expect(phoenixLoader.getEventsList).toHaveBeenCalledWith(eventData);
  });

  it('should get list of collections in the event data', () => {
    jest.spyOn(phoenixLoader, 'getCollections');
    phoenixLoader.getCollections();
    expect(phoenixLoader.getCollections).toHaveBeenCalled();
  });

  it('should get the collection with the given collection name from the event data', () => {
    const collectionName = 'collection1';
    jest.spyOn(phoenixLoader, 'getCollection');
    phoenixLoader.getCollection(collectionName);
    expect(phoenixLoader.getCollection).toHaveBeenCalledWith(collectionName);
  });

  it('should add label of event object to the labels object', () => {
    jest.spyOn(phoenixLoader, 'addLabelToEventObject');
    phoenixLoader.addLabelToEventObject('label', 'collection', 0);
    expect(phoenixLoader.addLabelToEventObject).toHaveBeenCalled();
  });

  it('should get the object containing labels of events', () => {
    jest.spyOn(phoenixLoader, 'getLabelsObject');
    phoenixLoader.getLabelsObject();
    expect(phoenixLoader.getLabelsObject).toHaveBeenCalled();
  });

  it('should get function to add options to scale event object type by given factor', () => {
    jest.spyOn(phoenixLoader, 'addScaleOptions');
    phoenixLoader.addScaleOptions('configKey', 'configLabel', () => {});
    expect(phoenixLoader.addScaleOptions).toHaveBeenCalled();
  });
});
