import {
  Component,
  ContentChild,
  Input,
  NgZone,
  ViewChild,
  type OnInit,
  type AfterViewInit,
  type OnDestroy,
  ViewEncapsulation,
  ElementRef,
} from '@angular/core';

import { EventDisplayService } from '../../../services/event-display.service';

let maxZIndex = 100;

/** State of an in-progress resize of the overlay. */
interface ResizeSession {
  pointerId: number;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
}

/**
 * Component for overlay panel.
 */
@Component({
  standalone: false,
  selector: 'app-overlay',
  templateUrl: './overlay.component.html',
  styleUrls: ['./overlay.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class OverlayComponent implements OnInit, AfterViewInit, OnDestroy {
  /** Title of the overlay. */
  @Input() overlayTitle: string;
  /** If the overlay is open or not. */
  private _active: boolean = false;

  @Input()
  set active(value: boolean) {
    this._active = value;
    if (value) {
      setTimeout(() => this.bringToFront(), 0);
    }
  }

  get active(): boolean {
    return this._active;
  }
  /** Icon of the overlay header. */
  @Input() icon: string;
  /** If the overlay is resizable. */
  @Input() resizable: boolean = false;
  /** If the overlay body is transparent or not. */
  @Input() transparentBody: boolean = false;
  /** If the aspect ratio is kept fixed or not. */
  @Input() keepAspectRatioFixed: boolean = false;
  /** If the overlay body is visible or not. */
  showBody: boolean = true;
  /** Aspect ratio of the overlay view. */
  aspectRatio: number = window.innerWidth / window.innerHeight;

  // ********************************************************************************
  // * Below code is specific to the overlay resize feature. (LOOK INTO CSS RESIZE) *
  // ********************************************************************************

  /** Complete overlay card containing both header and body. */
  @ViewChild('overlayCard') overlayCard: ElementRef;
  /** Handle for resizing the overlay. */
  @ViewChild('resizeHandleCorner') resizeHandleCorner: ElementRef;

  /** reference for the overlay. picked from ng-content */
  @ContentChild('overlayWindow') overlayWindow!: ElementRef<HTMLCanvasElement>;

  /** Minimum resizable width. */
  private MIN_RES_WIDTH: number = 300;
  /** Minimum resizable height */
  private MIN_RES_HEIGHT: number = 100;

  /** The resize currently being dragged, or `null` if there is none. */
  private resizeSession: ResizeSession | null = null;

  constructor(
    private eventDisplay: EventDisplayService,
    private elementRef: ElementRef,
    private ngZone: NgZone,
  ) {}

  ngOnInit() {}

  toggleBodyAndEmit() {
    this.showBody = !this.showBody;
  }

  /** Bring the overlay to the front. */
  bringToFront() {
    maxZIndex++;
    const wrapper = this.elementRef.nativeElement.closest(
      '.cdk-global-overlay-wrapper',
    );
    if (wrapper) {
      wrapper.style.zIndex = maxZIndex.toString();
    }
    const pane = this.elementRef.nativeElement.closest('.cdk-overlay-pane');
    if (pane) {
      pane.style.zIndex = maxZIndex.toString();
    }
  }

  ngAfterViewInit() {
    this.bringToFront();
  }

  /**
   * Clean up any resize still in progress when the component is destroyed.
   */
  ngOnDestroy() {
    this.stopResize();
  }

  /**
   * Start resizing the overlay card.
   *
   * The pointer is captured by the handle so that every subsequent move and,
   * crucially, the closing `pointerup` are delivered to us even if the cursor
   * leaves the handle or the window. Without the capture a fast drag can end
   * outside the handle and leave the overlay glued to the cursor.
   * @param event Pointer event that started the resize.
   */
  onResizeStart(event: PointerEvent) {
    if (!this.resizable || this.resizeSession) {
      return;
    }

    event.preventDefault();
    this.bringToFront();

    // The 3D overlay sizes its canvas, everything else sizes the whole card,
    // so measure whichever one the drag is going to act on.
    const startRect = (
      this.overlayWindow?.nativeElement ?? this.overlayCard.nativeElement
    ).getBoundingClientRect();
    this.resizeSession = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startWidth: startRect.width,
      startHeight: startRect.height,
    };

    const handle = this.resizeHandleCorner.nativeElement as HTMLElement;
    try {
      handle.setPointerCapture?.(event.pointerId);
    } catch {
      // Capturing is best effort; the listeners below still end the resize.
    }

    // Resizing only writes to the DOM and the renderer, so it does not need to
    // trigger change detection on every pointer move.
    this.ngZone.runOutsideAngular(() => {
      handle.addEventListener('pointermove', this.onResizeMove);
      handle.addEventListener('pointerup', this.onResizeEnd);
      handle.addEventListener('pointercancel', this.onResizeEnd);
      handle.addEventListener('lostpointercapture', this.onResizeEnd);
      document.addEventListener('keydown', this.onResizeKeyDown);
    });
  }

  /** Resize the overlay to follow the pointer. */
  private onResizeMove = (event: PointerEvent) => {
    const session = this.resizeSession;
    if (!session || event.pointerId !== session.pointerId) {
      return;
    }
    // The button can be released where the page never sees it, e.g. outside the
    // window. Noticing that the button is gone stops the overlay from staying
    // glued to the cursor.
    if (event.pointerType === 'mouse' && event.buttons === 0) {
      this.stopResize();
      return;
    }
    event.preventDefault();

    const width = Math.max(
      this.MIN_RES_WIDTH,
      session.startWidth + (event.clientX - session.startX),
    );
    const height = Math.max(
      this.MIN_RES_HEIGHT,
      session.startHeight + (event.clientY - session.startY),
    );

    this.applySize(
      width,
      this.keepAspectRatioFixed ? width / this.aspectRatio : height,
    );
  };

  /** End the resize once the pointer is released, cancelled or lost. */
  private onResizeEnd = (event: PointerEvent) => {
    if (
      this.resizeSession &&
      event.pointerId !== this.resizeSession.pointerId
    ) {
      return;
    }
    this.stopResize();
  };

  /** Abandon the resize and restore the original size on Escape. */
  private onResizeKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !this.resizeSession) {
      return;
    }
    const { startWidth, startHeight } = this.resizeSession;
    this.stopResize();
    if (startWidth > 0 && startHeight > 0) {
      this.applySize(startWidth, startHeight);
    }
  };

  /**
   * Stop the resize in progress, if any, releasing the pointer and detaching
   * every listener added when it started.
   */
  private stopResize() {
    const session = this.resizeSession;
    if (!session) {
      return;
    }
    this.resizeSession = null;

    document.removeEventListener('keydown', this.onResizeKeyDown);

    const handle = this.resizeHandleCorner?.nativeElement as HTMLElement;
    if (!handle) {
      return;
    }
    handle.removeEventListener('pointermove', this.onResizeMove);
    handle.removeEventListener('pointerup', this.onResizeEnd);
    handle.removeEventListener('pointercancel', this.onResizeEnd);
    handle.removeEventListener('lostpointercapture', this.onResizeEnd);
    try {
      if (handle.hasPointerCapture?.(session.pointerId)) {
        handle.releasePointerCapture(session.pointerId);
      }
    } catch {
      // The pointer may already be gone; nothing left to release.
    }
  }

  /**
   * Resize the overlay content to the given size.
   * @param width New width of the overlay content in pixels.
   * @param height New height of the overlay content in pixels.
   */
  private applySize(width: number, height: number) {
    const canvas = this.overlayWindow?.nativeElement;

    if (canvas) {
      const oldratioW = width / canvas.width;
      const oldratioH = height / canvas.height;
      this.eventDisplay
        .getThreeManager()
        .getOverlayRenderer()
        .setSize(width, height);
      this.eventDisplay
        .getThreeManager()
        .syncOverlayViewPort(oldratioW, oldratioH);
      return;
    }

    // Fallback for generic content that does not have a 3D canvas
    const overlayCardElement = this.overlayCard.nativeElement;
    overlayCardElement.style.width = width + 'px';
    overlayCardElement.style.height = height + 'px';
    const contentWrapper = overlayCardElement.querySelector(
      '.overlay-card-content',
    );
    if (contentWrapper) {
      contentWrapper.style.flex = '1';
      contentWrapper.style.overflow = 'auto';
      contentWrapper.style.maxHeight = 'none';
      const contentBody = contentWrapper.firstElementChild as HTMLElement;
      if (contentBody) {
        // Fill the card when there is room to spare, but keep the natural
        // height when there is not so the wrapper can scroll instead of
        // clipping the content.
        contentBody.style.width = '100%';
        contentBody.style.height = 'auto';
        contentBody.style.minHeight = '100%';
        contentBody.style.maxWidth = 'none';
        contentBody.style.maxHeight = 'none';
      }
    }
  }
}
