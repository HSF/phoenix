import JSZip from 'jszip';
import { readZipFile, loadEventsFromZip } from '../../helpers/zip';

describe('Zip Helper', () => {
  it('should read zip file and return contents', async () => {
    const zip = new JSZip();
    zip.file('test.json', '{"event": 1}');
    const blob = await zip.generateAsync({ type: 'arraybuffer' });

    const contents = await readZipFile(blob);
    expect(contents['test.json']).toBe('{"event": 1}');
  });

  it('should extract and parse JSON events from zip', async () => {
    const zip = new JSZip();
    zip.file('event1.json', '{"Event1": {"Tracks": {}}}');
    zip.file('event2.json', '{"Event2": {"Jets": {}}}');
    const blob = await zip.generateAsync({ type: 'arraybuffer' });

    const events = await loadEventsFromZip(blob);
    expect(events['Event1']).toBeDefined();
    expect(events['Event2']).toBeDefined();
  });

  it('should parse XML events using JiveXMLLoader when provided', async () => {
    const zip = new JSZip();
    zip.file('JiveXML_1.xml', '<g></g>');
    const blob = await zip.generateAsync({ type: 'arraybuffer' });

    const mockJiveLoader = {
      process: jest.fn(),
      getEventData: jest.fn().mockReturnValue({ EventXML: {} }),
    };

    const events = await loadEventsFromZip(blob, mockJiveLoader as any);
    expect(mockJiveLoader.process).toHaveBeenCalledWith('<g></g>');
    expect(events['JiveXML_1.xml']).toEqual({ EventXML: {} });
  });

  it('should parse mixed JSON and XML archive', async () => {
    const zip = new JSZip();
    zip.file('event1.json', '{"Event1": {"Tracks": {}}}');
    zip.file('JiveXML_1.xml', '<g></g>');
    const blob = await zip.generateAsync({ type: 'arraybuffer' });

    const mockJiveLoader = {
      process: jest.fn(),
      getEventData: jest.fn().mockReturnValue({ EventXML: {} }),
    };

    const events = await loadEventsFromZip(blob, mockJiveLoader as any);
    expect(events['Event1']).toBeDefined();
    expect(mockJiveLoader.process).toHaveBeenCalledWith('<g></g>');
    expect(events['JiveXML_1.xml']).toEqual({ EventXML: {} });
  });
});
