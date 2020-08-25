import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AnimateCameraComponent } from './animate-camera.component';
import { EventdisplayService } from '../../../services/eventdisplay.service';

describe('AnimateCameraComponent', () => {
  let component: AnimateCameraComponent;
  let fixture: ComponentFixture<AnimateCameraComponent>;

  let mockEventDisplay = jasmine.createSpyObj('EventdisplayService', ['animateThroughEvent']);

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AnimateCameraComponent],
      providers: [{
        provide: EventdisplayService,
        useValue: mockEventDisplay
      }]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnimateCameraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start animation on toggle', () => {
    expect(component.isAnimating).toBeFalse();
    component.toggleAnimateCamera();
    expect(component.isAnimating).toBeTrue();
    expect(mockEventDisplay.animateThroughEvent).toHaveBeenCalled();
    component.toggleAnimateCamera();
  });
});
