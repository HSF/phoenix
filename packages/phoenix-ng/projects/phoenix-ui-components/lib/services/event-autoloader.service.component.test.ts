import { EventAutoloaderService } from './event-autoloader.service';

describe('EventAutoloaderService', () => {
  let service: EventAutoloaderService;
  let mockEventDisplay: any;
  let mockFileLoader: any;

  beforeEach(() => {
    mockEventDisplay = {
      parsePhoenixEvents: jest.fn(),
      buildEventDataFromJSON: jest.fn(),
    };
    mockFileLoader = {
      loadJiveXMLEvent: jest.fn(),
    };
    service = new EventAutoloaderService(mockEventDisplay, mockFileLoader);
  });

  afterEach(() => {
    service.stop();
  });

  it('should route __jivexml__ payloads to FileLoaderService.loadJiveXMLEvent', () => {
    (service as any).handleEvent({ __jivexml__: '<Event></Event>' });
    expect(mockFileLoader.loadJiveXMLEvent).toHaveBeenCalledWith(
      '<Event></Event>',
      mockEventDisplay,
    );
  });

  it('should route single-event JSON payloads to EventDisplayService.buildEventDataFromJSON', () => {
    const singleEvent = { Tracks: [{ pos: [0, 0, 0] }] };
    (service as any).handleEvent(singleEvent);
    expect(mockEventDisplay.buildEventDataFromJSON).toHaveBeenCalledWith(
      singleEvent,
    );
  });

  it('should route multi-event Phoenix JSON payloads to EventDisplayService.parsePhoenixEvents', () => {
    const multiEvent = {
      Event1: { Tracks: {} },
      Event2: { Tracks: {} },
    };
    (service as any).handleEvent(multiEvent);
    expect(mockEventDisplay.parsePhoenixEvents).toHaveBeenCalledWith(
      multiEvent,
    );
  });
});
