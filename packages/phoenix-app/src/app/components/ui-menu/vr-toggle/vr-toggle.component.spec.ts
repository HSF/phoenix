import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { VrToggleComponent } from './vr-toggle.component';
import { EventDisplayService } from '../../../services/eventdisplay.service';

describe('VrToggleComponent', () => {
  let component: VrToggleComponent;
  let fixture: ComponentFixture<VrToggleComponent>;

  const mockEventDisplay = jasmine.createSpyObj('EventDisplayService', ['initVR', 'endVR']);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [{
        provide: EventDisplayService,
        useValue: mockEventDisplay
      }],
      declarations: [VrToggleComponent]
    })
      .compileComponents();
  }));

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
    expect(mockEventDisplay.initVR).toHaveBeenCalled();

    component.toggleVr();
    expect(component.vrActive).toBeFalse();
    expect(mockEventDisplay.endVR).toHaveBeenCalled();
  });
});
