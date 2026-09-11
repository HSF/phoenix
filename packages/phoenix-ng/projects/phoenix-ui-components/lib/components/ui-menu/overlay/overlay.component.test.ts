import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverlayComponent } from './overlay.component';
import { ElementRef } from '@angular/core';
import { PhoenixUIModule } from '../../phoenix-ui.module';
import { EventDisplayService } from '../../../services/event-display.service';

describe('OverlayComponent', () => {
  let component: OverlayComponent;
  let fixture: ComponentFixture<OverlayComponent>;

  const mockEventDisplay = {
    getThreeManager: jest.fn().mockReturnValue({
      initOverlayControls: jest.fn(),
      revertMainCamera: jest.fn().mockReturnValue(false),
    }),
    setOverlayRenderer: jest.fn(),
    fixOverlayView: jest.fn(),
    getUIManager: jest.fn().mockReturnThis(),
    toggleOrthographicView: jest.fn().mockReturnThis(),
  };

  /**
   * jsdom does not implement `PointerEvent`, so build a `MouseEvent` carrying
   * the pointer id the component looks at.
   */
  const pointerEvent = (
    type: string,
    clientX: number,
    clientY: number,
    pointerId = 1,
  ): PointerEvent => {
    const event: any = new MouseEvent(type, { clientX, clientY });
    event.pointerId = pointerId;
    return event as PointerEvent;
  };

  const mockRect = (element: HTMLElement, width: number, height: number) => {
    element.getBoundingClientRect = jest
      .fn()
      .mockReturnValue({ width, height, top: 0, left: 0 } as DOMRect);
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
      declarations: [OverlayComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(OverlayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize to not be resizable', () => {
    component.resizable = false;
    fixture.detectChanges();

    expect(component.resizeHandleCorner).toBeFalsy();
  });

  it('should initialize to be resizable', () => {
    component.resizable = true;
    component.showBody = true;
    fixture.detectChanges();

    expect(component.resizeHandleCorner).toBeTruthy();
  });

  describe('resizing', () => {
    let card: HTMLElement;
    let handle: HTMLElement;

    beforeEach(() => {
      component.resizable = true;
      component.showBody = true;

      card = document.createElement('div');
      handle = document.createElement('span');
      mockRect(card, 400, 300);

      component.overlayCard = new ElementRef(card);
      component.resizeHandleCorner = new ElementRef(handle);
    });

    it('should resize the overlay card as the pointer moves', () => {
      component.onResizeStart(pointerEvent('pointerdown', 400, 300));
      handle.dispatchEvent(pointerEvent('pointermove', 450, 360));

      expect(card.style.width).toBe('450px');
      expect(card.style.height).toBe('360px');
    });

    it('should not resize below the minimum size', () => {
      component.onResizeStart(pointerEvent('pointerdown', 400, 300));
      handle.dispatchEvent(pointerEvent('pointermove', 0, 0));

      expect(card.style.width).toBe('300px');
      expect(card.style.height).toBe('100px');
    });

    it('should stop resizing once the pointer is released', () => {
      component.onResizeStart(pointerEvent('pointerdown', 400, 300));
      handle.dispatchEvent(pointerEvent('pointermove', 450, 360));
      handle.dispatchEvent(pointerEvent('pointerup', 450, 360));

      // Any further movement must not drag the overlay along with the cursor.
      handle.dispatchEvent(pointerEvent('pointermove', 800, 800));

      expect(card.style.width).toBe('450px');
      expect(card.style.height).toBe('360px');
    });

    it('should stop resizing when the pointer capture is lost', () => {
      component.onResizeStart(pointerEvent('pointerdown', 400, 300));
      handle.dispatchEvent(pointerEvent('lostpointercapture', 400, 300));
      handle.dispatchEvent(pointerEvent('pointermove', 800, 800));

      expect(card.style.width).toBe('');
    });

    it('should restore the original size on Escape', () => {
      component.onResizeStart(pointerEvent('pointerdown', 400, 300));
      handle.dispatchEvent(pointerEvent('pointermove', 600, 500));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      expect(card.style.width).toBe('400px');
      expect(card.style.height).toBe('300px');

      handle.dispatchEvent(pointerEvent('pointermove', 800, 800));

      expect(card.style.width).toBe('400px');
    });

    it('should stop resizing when the component is destroyed', () => {
      component.onResizeStart(pointerEvent('pointerdown', 400, 300));
      component.ngOnDestroy();
      handle.dispatchEvent(pointerEvent('pointermove', 800, 800));

      expect(card.style.width).toBe('');
    });
  });
});
