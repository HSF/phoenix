import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CMSComponent } from './cms.component';
import { EventDisplayService } from 'phoenix-ui-components/lib/services/event-display.service';
import { CMSLoader } from 'phoenix-event-display';

describe.skip('CMSComponent', () => {
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
    getLoadingManager: jest.fn().mockReturnThis(),
  };

  const mockCMSLoader = {};

  beforeAll(() => {
    window.fetch = jest.fn();
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: CMSLoader,
          useValue: mockCMSLoader,
        },
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

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Test if three.js is initialized
  it('should initialize three.js canvas', () => {
    jest.spyOn(mockEventDisplay, 'parsePhoenixEvents');
    component.ngOnInit();
    expect(document.getElementById('three-canvas')).toBeTruthy();
  });
});
