import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AtlasComponent } from './atlas.component';
import { EventDisplayService } from 'phoenix-ui-components/lib/services/event-display.service';

describe('AtlasComponent', () => {
  let component: AtlasComponent;
  let fixture: ComponentFixture<AtlasComponent>;

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
    fixture = TestBed.createComponent(AtlasComponent);
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
