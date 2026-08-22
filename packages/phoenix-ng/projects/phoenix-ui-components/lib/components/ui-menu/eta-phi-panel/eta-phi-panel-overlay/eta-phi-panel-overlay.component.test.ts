import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EtaPhiPanelOverlayComponent } from './eta-phi-panel-overlay.component';
import { EventDisplayService } from '../../../../services/event-display.service';
import { PhoenixUIModule } from '../../../phoenix-ui.module';

describe('EtaPhiPanelOverlayComponent', () => {
  let component: EtaPhiPanelOverlayComponent;
  let fixture: ComponentFixture<EtaPhiPanelOverlayComponent>;

  const mockEventDisplay = {
    listenToDisplayedEventChange: jest.fn((callback) => {
      callback();
      return jest.fn();
    }),
    listenToStateChange: jest.fn((callback) => {
      callback();
      return jest.fn();
    }),
    getCollections: jest.fn().mockReturnValue({
      CaloCells: ['CaloCellsCollection'],
      Tracks: ['TracksCollection'],
      Jets: ['JetsCollection'],
    }),
    getCollection: jest.fn().mockImplementation((name: string) => {
      if (name === 'CaloCellsCollection') {
        return [{ eta: 0.1, phi: 0.2, energy: 5000 }];
      }
      if (name === 'TracksCollection') {
        return [{ eta: 0.5, phi: 0.5, pT: 2000, uuid: 'trk1' }];
      }
      if (name === 'JetsCollection') {
        return [{ eta: -0.2, phi: 1.0, energy: 10000, uuid: 'jet1' }];
      }
      return [];
    }),
    isCollectionVisible: jest.fn().mockReturnValue(true),
    isItemVisible: jest.fn().mockReturnValue(true),
    highlightObject: jest.fn(),
    lookAtObject: jest.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
      providers: [
        {
          provide: EventDisplayService,
          useValue: mockEventDisplay,
        },
      ],
      declarations: [EtaPhiPanelOverlayComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EtaPhiPanelOverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should listen to state changes on init', () => {
    expect(mockEventDisplay.listenToStateChange).toHaveBeenCalled();
  });

  it('should filter markers when a collection is not visible', () => {
    mockEventDisplay.isCollectionVisible.mockImplementation(
      (collName: string) => collName !== 'TracksCollection',
    );
    (component as any).rebuildData();
    const trackMarker = (component as any).markers.find(
      (m: any) => m.type === 'track',
    );
    expect(trackMarker).toBeUndefined();
  });

  it('should filter markers when item is hidden by cuts', () => {
    mockEventDisplay.isCollectionVisible.mockReturnValue(true);
    mockEventDisplay.isItemVisible.mockImplementation(
      (_collName: string, item: any) => item.uuid !== 'trk1',
    );
    (component as any).rebuildData();
    const trackMarker = (component as any).markers.find(
      (m: any) => m.type === 'track',
    );
    expect(trackMarker).toBeUndefined();
  });
});
