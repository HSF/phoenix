import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventDataFormat } from '../../services/extras/event-data-import';
import { PhoenixUIModule } from '../phoenix-ui.module';

import { UiMenuComponent } from './ui-menu.component';
import { EventDisplayService } from '../../services/event-display.service';

describe('UiMenuComponent', () => {
  let component: UiMenuComponent;
  let fixture: ComponentFixture<UiMenuComponent>;

  const mockEventDataFormat = {};

  const mockEventDisplay = {
    init: jest.fn(),
    getStateManager: jest.fn().mockReturnThis(),
    clippingEnabled: jest.fn().mockReturnThis(),
    startClippingAngle: jest.fn().mockReturnThis(),
    openingClippingAngle: jest.fn().mockReturnThis(),
    listenToLoadedEventsChange: jest.fn(),
    getUIManager: jest.fn().mockReturnThis(),
    getPresetViews: jest.fn().mockReturnThis().mockReturnValue([]),
    getDarkTheme: jest.fn().mockReturnThis(),
    buildEventDataFromJSON: jest.fn(),
    setOverlayRenderer: jest.fn().mockReturnThis(),
    allowSelection: jest.fn().mockReturnThis(),
    getInfoLogger: jest.fn().mockReturnThis(),
    getInfoLoggerList: jest.fn().mockReturnThis(),
  };

  const mockStateManager = mockEventDisplay.getStateManager();
  mockStateManager.clippingEnabled.onUpdate = jest.fn();
  mockStateManager.startClippingAngle.onUpdate = jest.fn();
  mockStateManager.openingClippingAngle.onUpdate = jest.fn();

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UiMenuComponent],
      providers: [
        {
          provide: EventDataFormat,
          useValue: mockEventDataFormat,
        },
        {
          provide: EventDisplayService,
          useValue: mockEventDisplay,
        },
      ],
      imports: [PhoenixUIModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UiMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
