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

    it('should anchor a bottom/right positioned overlay by its top left corner', () => {
      const wrapper = document.createElement('div');
      wrapper.className = 'cdk-global-overlay-wrapper';
      wrapper.style.justifyContent = 'flex-end';
      wrapper.style.alignItems = 'flex-end';
      const pane = document.createElement('div');
      pane.className = 'cdk-overlay-pane';
      pane.style.marginRight = '15px';
      pane.style.marginBottom = '80px';
      wrapper.appendChild(pane);
      pane.appendChild(fixture.nativeElement);

      // Bottom/right anchored at first, then at the top left of the wrapper.
      pane.getBoundingClientRect = jest
        .fn()
        .mockReturnValueOnce({ left: 500, top: 200 } as DOMRect)
        .mockReturnValueOnce({ left: 0, top: 0 } as DOMRect);

      component.onResizeStart(pointerEvent('pointerdown', 400, 300));

      expect(wrapper.style.justifyContent).toBe('flex-start');
      expect(wrapper.style.alignItems).toBe('flex-start');
      expect(pane.style.marginLeft).toBe('500px');
      expect(pane.style.marginTop).toBe('200px');
      expect(pane.style.marginRight).toBe('0px');
      expect(pane.style.marginBottom).toBe('0px');
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
