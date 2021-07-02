import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnimateCameraComponent } from './animate-camera.component';
import { EventDisplayService } from '../../../services/event-display.service';
import { PhoenixUIModule } from '../../phoenix-ui.module';

describe('AnimateCameraComponent', () => {
  let component: AnimateCameraComponent;
  let fixture: ComponentFixture<AnimateCameraComponent>;

  const mockEventDisplay = jasmine.createSpyObj('EventDisplayService', [
    'animateThroughEvent',
  ]);

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [PhoenixUIModule],
      declarations: [AnimateCameraComponent],
      providers: [
        {
          provide: EventDisplayService,
          useValue: mockEventDisplay,
        },
      ],
    }).compileComponents();
  });

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
    component.animateCamera();
    expect(component.isAnimating).toBeTrue();
    expect(mockEventDisplay.animateThroughEvent).toHaveBeenCalled();
    component.animateCamera();
  });
});
