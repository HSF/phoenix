import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventDisplayService } from 'phoenix-ui-components/lib/services/event-display.service';

import { LHCbComponent } from './lhcb.component';

describe('LHCbComponent', () => {
  let component: LHCbComponent;
  let fixture: ComponentFixture<LHCbComponent>;

  const mockEventDisplay = {
    init: jest.fn(),
    loadGLTFGeometry: jest.fn(),
    getLoadingManager: jest.fn().mockReturnThis(),
    addProgressListener: jest.fn().mockReturnThis(),
    addLoadListenerWithCheck: jest.fn().mockReturnThis(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: EventDisplayService,
          useValue: mockEventDisplay,
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LHCbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
