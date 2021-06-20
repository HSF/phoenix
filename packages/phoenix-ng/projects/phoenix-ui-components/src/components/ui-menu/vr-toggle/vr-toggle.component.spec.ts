import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VrToggleComponent } from './vr-toggle.component';
import { EventDisplayService } from '../../../services/event-display.service';
import { PhoenixUIModule } from '../../phoenix-ui.module';

describe('VrToggleComponent', () => {
  let component: VrToggleComponent;
  let fixture: ComponentFixture<VrToggleComponent>;

  const mockEventDisplay = jasmine.createSpyObj('EventDisplayService', [
    'initXR',
    'endXR',
  ]);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
      providers: [
        {
          provide: EventDisplayService,
          useValue: mockEventDisplay,
        },
      ],
      declarations: [VrToggleComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VrToggleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle VR', () => {
    component.toggleVr();
    expect(component.vrActive).toBeTrue();
    expect(mockEventDisplay.initXR).toHaveBeenCalled();

    component.toggleVr();
    expect(component.vrActive).toBeFalse();
    expect(mockEventDisplay.endXR).toHaveBeenCalled();
  });
});
