import { ComponentFixture, TestBed } from '@angular/core/testing';

jest.mock('recordrtc', () => {
  const RecordRTCMock: any = jest.fn().mockImplementation(() => ({
    startRecording: jest.fn(),
    stopRecording: jest.fn((cb: () => void) => cb()),
    getBlob: jest.fn(),
  }));
  RecordRTCMock.invokeSaveAsDialog = jest.fn();
  return { __esModule: true, default: RecordRTCMock };
});

import { AnimateCameraComponent } from './animate-camera.component';
import { EventDisplayService } from '../../../services/event-display.service';
import { PhoenixUIModule } from '../../phoenix-ui.module';
import { MatDialog } from '@angular/material/dialog';

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

  describe('downloadAnimation while an animation is already running', () => {
    it('should close the progress dialog and stop the timer', () => {
      jest.useFakeTimers();
      const close = jest.fn();
      const dialog = TestBed.inject(MatDialog);
      jest.spyOn(dialog, 'open').mockReturnValue({ close } as any);

      // The canvas is only reachable through the renderer, which the mock
      // display does not build, so stub the capture path.
      const canvas = document.createElement('canvas');
      (canvas as any).captureStream = jest.fn().mockReturnValue({});
      (mockEventDisplay as any).getRendererManager = jest
        .fn()
        .mockReturnValue({ getMainRenderer: () => ({ domElement: canvas }) });

      // An animation is already in flight, so `animateCamera` bails out.
      component.isAnimating = true;
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      component.downloadAnimation();

      expect(close).toHaveBeenCalled();
      expect(clearIntervalSpy).toHaveBeenCalled();
      jest.useRealTimers();
    });

    it('should leave the dialog open while the animation records', () => {
      jest.useFakeTimers();
      const close = jest.fn();
      const dialog = TestBed.inject(MatDialog);
      jest.spyOn(dialog, 'open').mockReturnValue({ close } as any);

      const canvas = document.createElement('canvas');
      (canvas as any).captureStream = jest.fn().mockReturnValue({});
      (mockEventDisplay as any).getRendererManager = jest
        .fn()
        .mockReturnValue({ getMainRenderer: () => ({ domElement: canvas }) });

      component.isAnimating = false;
      component.downloadAnimation();

      // The animation started, so the dialog stays up until it finishes.
      expect(close).not.toHaveBeenCalled();
      jest.useRealTimers();
    });
  });
});
