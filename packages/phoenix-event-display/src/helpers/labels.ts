/**
 * Get title of the label.
 * @param eventDataType Event data type of the event data object.
 * @param collection Collection the event data object is in.
 * @param index Index of the event data object in the collection.
 * @returns A string identifying the label.
 */
export const getLabelTitle = (
  eventDataType: string,
  collection: string,
  index: string | number
) => `${eventDataType} > ${collection} > ${index}`;
