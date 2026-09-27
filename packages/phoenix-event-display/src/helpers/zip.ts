import JSZip from 'jszip';

/**
 * Read a zip file and return its contents as an object.
 * @param file The file or array buffer to be read.
 * @returns An object with file paths in zip as keys and the files'
 * string contents as values.
 */
export const readZipFile = async (file: File | ArrayBuffer) => {
  const archive = new JSZip();
  const filesWithData: { [fileName: string]: string } = {};

  await archive.loadAsync(file);
  for (const filePath in archive.files) {
    const fileData =
      (await archive.file(filePath)?.async('string')) ?? 'Unable to read file';
    filesWithData[filePath] = fileData;
  }

  return filesWithData;
};

/**
 * Extract and parse all JSON and XML (JiveXML) event files contained inside a zip archive.
 * @param file The zip file or array buffer to be read.
 * @param jiveXMLLoader Optional JiveXMLLoader instance to process XML events.
 * @returns Object with parsed event names as keys and event data objects as values.
 */
export const loadEventsFromZip = async (
  file: File | ArrayBuffer,
  jiveXMLLoader?: any,
  infoLogger?: any,
): Promise<{ [key: string]: any }> => {
  const filesWithData = await readZipFile(file);
  const allEventsObject: { [key: string]: any } = {};

  // Parse JSON event data
  Object.keys(filesWithData)
    .filter((fileName) => fileName.endsWith('.json'))
    .forEach((fileName) => {
      try {
        Object.assign(allEventsObject, JSON.parse(filesWithData[fileName]));
      } catch (error) {
        console.error(`Could not parse ${fileName} - invalid JSON.`, error);
        infoLogger?.add(`Could not parse ${fileName}`, 'Error');
      }
    });

  // Parse JiveXML event data if present
  const xmlFiles = Object.keys(filesWithData).filter(
    (fileName) => fileName.endsWith('.xml') || fileName.startsWith('JiveXML'),
  );

  if (xmlFiles.length > 0 && jiveXMLLoader) {
    xmlFiles.forEach((fileName) => {
      try {
        jiveXMLLoader.process(filesWithData[fileName]);
        const eventData = jiveXMLLoader.getEventData();
        if (eventData) {
          Object.assign(allEventsObject, { [fileName]: eventData });
        }
      } catch (error) {
        console.error(
          `Error parsing JiveXML file ${fileName} from zip:`,
          error,
        );
        infoLogger?.add(`Could not parse ${fileName}`, 'Error');
      }
    });
  }

  return allEventsObject;
};
