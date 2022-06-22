import { getLabelTitle } from '../../../src/helpers/labels';

describe('Labels', () => {
  it('should return the correct label for the given event', () => {
    const eventDataType = 'eventDataType';
    const collection = 'collection';
    const index = 'index';
    const label = getLabelTitle(eventDataType, collection, index);
    expect(label).toBe(`${eventDataType} > ${collection} > ${index}`);
  });
});
