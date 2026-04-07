import { FileLoaderService } from './file-loader.service';
import { EventDisplayService } from './event-display.service';

describe('FileLoaderService', () => {
  let service: FileLoaderService;
  let mockEventDisplay: any;

  beforeEach(() => {
    mockEventDisplay = {};
    service = new FileLoaderService();
  });

  it('should load event based on file type', () => {
    // Mock the loadJSONEvent method
    const loadJSONEventSpy = jest
      .spyOn(service, 'loadJSONEvent')
      .mockImplementation();
    const makeRequestSpy = jest
      .spyOn(service, 'makeRequest' as any)
      .mockImplementation(
        (
          _arg1: string,
          _arg2: 'json' | 'text' | 'blob',
          onData: (data: any) => void,
        ) => {
          onData('test');
          return true;
        },
      );

    service.loadEvent(
      'https://example.com/event_data/test.json',
      mockEventDisplay,
    );
    expect(loadJSONEventSpy).toHaveBeenCalled();

    // Test loading XML
    const loadJiveXMLEventSpy = jest
      .spyOn(service, 'loadJiveXMLEvent')
      .mockImplementation();
    service.loadEvent(
      'https://example.com/event_data/test.xml',
      mockEventDisplay,
    );
    expect(loadJiveXMLEventSpy).toHaveBeenCalled();

    // Clean up
    loadJSONEventSpy.mockRestore();
    loadJiveXMLEventSpy.mockRestore();
    makeRequestSpy.mockRestore();
  });
});
