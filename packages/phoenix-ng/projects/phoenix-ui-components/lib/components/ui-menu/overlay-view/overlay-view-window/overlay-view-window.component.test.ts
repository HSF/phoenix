import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverlayViewWindowComponent } from './overlay-view-window.component';
import { EventDisplayService } from '../../../../services/event-display.service';
import { ElementRef } from '@angular/core';
import { PhoenixUIModule } from '../../../phoenix-ui.module';

describe('OverlayViewWindowComponent', () => {
  let component: OverlayViewWindowComponent;
  let fixture: ComponentFixture<OverlayViewWindowComponent>;

  const mockEventDisplay = {
    getUIManager: jest.fn().mockReturnThis(),
    toggleOrthographicView: jest.fn().mockReturnThis(),
    fixOverlayView: jest.fn(),
    setOverlayRenderer: jest.fn(),
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
      declarations: [OverlayViewWindowComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OverlayViewWindowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize overlay view window canvas', () => {
    jest.spyOn(component, 'initializeCanvas');

    const mockCanvasElement = new ElementRef(document.createElement('canvas'));
    component.overlayWindow = mockCanvasElement;

    component.ngAfterViewInit();

    expect(component.initializeCanvas).toHaveBeenCalledWith(
      mockCanvasElement.nativeElement
    );
    expect(mockEventDisplay.setOverlayRenderer).toHaveBeenCalledWith(
      mockCanvasElement.nativeElement
    );
  });

  it('should switch view of overlay view window', () => {
    expect(component.orthographicView).toBe(false);

    component.switchOverlayView();

    expect(component.orthographicView).toBe(true);
  });

  it('should fix overlay view', () => {
    expect(component.overlayViewFixed).toBe(false);

    component.fixOverlayView();

    expect(component.overlayViewFixed).toBe(true);
  });

  it('should toggle bg transparency', () => {
    expect(component.transparentBody).toBeFalsy();

    component.toggleBgTransparency();

    expect(component.transparentBody).toBeTruthy();
  });
});
