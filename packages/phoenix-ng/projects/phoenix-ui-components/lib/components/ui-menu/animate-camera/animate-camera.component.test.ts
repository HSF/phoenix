import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnimateCameraComponent } from './animate-camera.component';
import { EventDisplayService } from '../../../services/event-display.service';
import { PhoenixUIModule } from '../../phoenix-ui.module';

describe('AnimateCameraComponent', () => {
  let component: AnimateCameraComponent;
  let fixture: ComponentFixture<AnimateCameraComponent>;

  const mockEventDisplay = {
    animateThroughEvent: jest.fn(),
    getThreeManager: jest.fn().mockReturnThis(),
    getSceneManager: jest.fn().mockReturnThis(),
    animatePreset: jest.fn(),
  };

  const mockScene = mockEventDisplay.getSceneManager();
  mockScene.getObjectByName = jest.fn();
  mockScene.setGeometryOpacity = jest.fn();

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
    expect(component.isAnimating).toBe(false);

    component.animateCamera();

    expect(component.isAnimating).toBe(true);
    expect(mockEventDisplay.animateThroughEvent).toHaveBeenCalled();
  });

  it('should animate preset', () => {
    jest.spyOn(mockEventDisplay, 'animateThroughEvent');
    component.animatePreset('test');
    expect(mockEventDisplay.animateThroughEvent).toHaveBeenCalled();
  });
});
