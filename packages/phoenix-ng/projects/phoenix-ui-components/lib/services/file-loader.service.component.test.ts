import { FileLoaderService } from './file-loader.service';
import { EventDisplayService } from './event-display.service';

describe.skip('FileLoaderService', () => {
  let service: FileLoaderService;
  let mockEventDisplay: any;

  const mockFileLoaderService = {
    loadEvent: jest.fn(),
    loadJSONEvent: jest.fn(),
    loadJiveXMLEvent: jest.fn(),
  };

  beforeEach(() => {
    mockEventDisplay = {};
  });

  it('should load event based on file type', () => {
    jest
      .spyOn(FileLoaderService.prototype, 'makeRequest')
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
    jest.spyOn(FileLoaderService.prototype, 'loadJSONEvent');
    service.loadEvent(
      'https://example.com/event_data/test.json',
      mockEventDisplay,
    );
    expect(mockFileLoaderService.loadJSONEvent).toHaveBeenCalled();

    jest.spyOn(FileLoaderService.prototype, 'loadJiveXMLEvent');
    service.loadEvent(
      'https://example.com/event_data/test.xml',
      mockEventDisplay,
    );
    expect(mockFileLoaderService.loadJiveXMLEvent).toHaveBeenCalled();

    jest.spyOn(FileLoaderService.prototype, 'loadEvent');
    service.reloadLastEvents(mockEventDisplay);
    expect(mockFileLoaderService.loadEvent).toHaveBeenCalledWith(
      'https://example.com/event_data/test.xml',
    );
  });
});
