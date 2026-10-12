/**
 * @jest-environment jsdom
 */
import JSZip from 'jszip';
import { readZipFile, loadEventsFromZip } from '../../helpers/zip';
import { JiveXMLLoader } from '../../loaders/jivexml-loader';

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

  it('should preserve JSON events and parse JiveXML metadata from a mixed zip', async () => {
    const jsonEvent = { eventNumber: '21', Tracks: {} };
    const xml =
      '<Event eventNumber="42" runNumber="7" lumiBlock="3" dateTime="2026-01-01"/>';
    const zip = new JSZip();
    zip.file('test_data.json', JSON.stringify({ jsonEvent }));
    zip.file('test_data.xml', xml);
    const archive = await zip.generateAsync({ type: 'arraybuffer' });

    const events = await loadEventsFromZip(archive, new JiveXMLLoader());

    expect(Object.keys(events).sort()).toEqual(['jsonEvent', 'test_data.xml']);
    expect(events.jsonEvent).toEqual(jsonEvent);
    expect(events['test_data.xml']).toMatchObject({
      eventNumber: '42',
      runNumber: '7',
      lumiBlock: '3',
      time: '2026-01-01',
    });
  });
});
