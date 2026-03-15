import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CMSComponent } from './cms.component';
import { EventDisplayService } from 'phoenix-ui-components';
import { CMSLoader } from 'phoenix-event-display';

describe('CMSComponent', () => {
  let component: CMSComponent;
  let fixture: ComponentFixture<CMSComponent>;

  const mockJSROOT = {
    NewHttpRequest: jest.fn(),
  };

  mockJSROOT.NewHttpRequest.mockImplementation(() => ({
    send: jest.fn(),
  }));

  const mockEventDisplay = {
    init: jest.fn(),
    loadRootJSONGeometry: jest.fn(),
    parsePhoenixEvents: jest.fn(),
    loadingManager: jest.fn().mockReturnThis(),
    itemLoaded: jest.fn().mockReturnThis(),
    getLoadingManager: jest.fn().mockReturnValue({
      addProgressListener: jest.fn(),
      addLoadListenerWithCheck: jest.fn(),
    }),
  };

  beforeAll(() => {
    window.fetch = jest.fn();
  });

  beforeEach(() => {
    // Mock CMSLoader
    jest
      .spyOn(CMSLoader.prototype, 'readIgArchive')
      .mockImplementation((url, callback) => {
        // Call the callback with empty events to avoid errors
        callback([]);
      });

    jest.spyOn(CMSLoader.prototype, 'getAllEventsData').mockReturnValue([]);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: EventDisplayService,
          useValue: mockEventDisplay,
        },
      ],
    });
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CMSComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Test if three.js is initialized
  it('should initialize three.js canvas', () => {
    jest.spyOn(mockEventDisplay, 'parsePhoenixEvents');
    component.ngOnInit();
    expect(mockEventDisplay.init).toHaveBeenCalled();
  });
});
