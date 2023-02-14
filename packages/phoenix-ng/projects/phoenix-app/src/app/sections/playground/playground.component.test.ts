import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventDisplayService } from 'phoenix-ui-components/lib/services/event-display.service';
import { PlaygroundComponent } from './playground.component';
import { AppModule } from '../../app.module';

describe('PlaygroundComponent', () => {
  let component: PlaygroundComponent;
  let fixture: ComponentFixture<PlaygroundComponent>;

  const mockEventDisplay = {
    init: jest.fn(),
    getLoadingManager: jest.fn().mockReturnThis(),
    addProgressListener: jest.fn().mockImplementation(() => {
      component.loadingProgress = 100;
    }),
    addLoadListenerWithCheck: jest.fn().mockImplementation(() => {
      component.loaded = true;
    }),
    getStateManager: jest.fn().mockReturnThis(),
    clippingEnabled: jest.fn().mockReturnThis(),
    startClippingAngle: jest.fn().mockReturnThis(),
    openingClippingAngle: jest.fn().mockReturnThis(),
    listenToLoadedEventsChange: jest.fn(),
    getUIManager: jest.fn().mockReturnThis(),
    getPresetViews: jest.fn().mockReturnThis().mockReturnValue([]),
    getDarkTheme: jest.fn().mockReturnThis(),
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
      imports: [AppModule],
      providers: [
        {
          provide: EventDisplayService,
          useValue: mockEventDisplay,
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PlaygroundComponent);
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
