import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AtlasMasterclassComponent } from './atlas-masterclass.component';
import { EventDisplayService } from 'phoenix-ui-components';

describe('AtlasMasterclassComponent', () => {
  let component: AtlasMasterclassComponent;
  let fixture: ComponentFixture<AtlasMasterclassComponent>;

  const mockEventDisplay = {
    init: jest.fn(),
    loadGLTFGeometry: jest.fn(),
    getLoadingManager: jest.fn().mockReturnThis(),
    addProgressListener: jest.fn().mockImplementation(() => {
      component.loadingProgress = 100;
    }),
    addLoadListenerWithCheck: jest.fn().mockImplementation(() => {
      component.loaded = true;
    }),
    getURLOptionsManager: jest.fn().mockReturnThis(),
    getURLOptions: jest.fn().mockReturnThis(),
    get: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
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
    fixture = TestBed.createComponent(AtlasMasterclassComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should hide VR, AR and animation toggles', () => {
    expect(component.uiConfig.showVRToggle).toBe(false);
    expect(component.uiConfig.showARToggle).toBe(false);
    expect(component.uiConfig.showAnimateCamera).toBe(false);
    expect(component.uiConfig.showAnimateEvent).toBe(false);
  });

  it('should enable the masterclass panel', () => {
    expect(component.uiConfig.showMasterclassPanel).toBe(true);
  });

  it('should use the ATLAS masterclass config', () => {
    expect(component.masterclassConfig.title).toContain('Masterclass');
    expect(component.masterclassConfig.particleTags.length).toBeGreaterThan(0);
  });
});
