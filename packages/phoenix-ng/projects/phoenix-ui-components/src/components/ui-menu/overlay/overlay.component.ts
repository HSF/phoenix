import {
  Component,
  Input,
  ViewChild,
  AfterViewInit,
  ViewEncapsulation,
} from '@angular/core';
import type { ElementRef } from '@angular/core';
import { ResizeSensor } from 'css-element-queries';

/**
 * Component for overlay panel.
 */
@Component({
  selector: 'app-overlay',
  templateUrl: './overlay.component.html',
  styleUrls: ['./overlay.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class OverlayComponent implements AfterViewInit {
  /** Title of the overlay. */
  @Input() overlayTitle: string;
  /** If the overlay is open or not. */
  @Input() active: boolean = false;
  /** Icon of the overlay header. */
  @Input() icon: string;
  /** If the overlay is resizable. */
  @Input() resizable: boolean = false;
  /** If the overlay body is transparent or not. */
  @Input() transparentBody: boolean = false;
  /** If the overlay body is visible or not. */
  showBody: boolean = true;

  // ********************************************************************************
  // * Below code is specific to the overlay resize feature. (LOOK INTO CSS RESIZE) *
  // ********************************************************************************

  /** Complete overlay card containing both header and body. */
  @ViewChild('overlayCard') overlayCard: ElementRef;
  /** Handle for resizing the overlay. */
  @ViewChild('resizeHandleCorner') resizeHandleCorner: ElementRef;
  /** Minimum resizable width. */
  private MIN_RES_WIDTH: number = 300;
  /** Minimum resizable height */
  private MIN_RES_HEIGHT: number = 100;

  /**
   * Move the resizable handle to the bottom right after the component is created.
   */
  ngAfterViewInit() {
    if (this.resizable) {
      const resizeHandleElement = this.resizeHandleCorner.nativeElement;
      resizeHandleElement.style.bottom = '0';
      resizeHandleElement.style.right = '0';

      new ResizeSensor(this.overlayCard.nativeElement, () => {
        this.resetHandlePosition();
      });

      window.addEventListener('resize', () => {
        this.resetHandlePosition();
      });
    }
  }

  /**
   * Resize the overlay card when the resize handle is dragged.
   */
  onResize() {
    const resizeHandleElement = this.resizeHandleCorner.nativeElement;
    const overlayCardElement = this.overlayCard.nativeElement;

    const dragRect = resizeHandleElement.getBoundingClientRect();
    const overlayRect = overlayCardElement.getBoundingClientRect();

    const width = dragRect.left - overlayRect.left + dragRect.width;
    const height = dragRect.top - overlayRect.top + dragRect.height;

    this.setHandleTransform(overlayRect, dragRect);

    if (width > this.MIN_RES_WIDTH && height > this.MIN_RES_HEIGHT) {
      overlayCardElement.style.width = width + 'px';
      overlayCardElement.style.height = height + 'px';
    }
  }

  /**
   * Reset resize handle position.
   */
  resetHandlePosition() {
    const resizeHandleElement = this.resizeHandleCorner.nativeElement;

    this.setHandleTransform(
      this.overlayCard.nativeElement.getBoundingClientRect(),
      resizeHandleElement.getBoundingClientRect()
    );

    resizeHandleElement.style.bottom = null;
    resizeHandleElement.style.right = null;
  }

  /**
   * Set the position of the resize handle using transform3d.
   * @param overlayRect Bounding client rectangle of the overlay card.
   * @param dragRect Bounding client rectangle of the resize handle.
   */
  private setHandleTransform(overlayRect: any, dragRect: any) {
    const translateX = overlayRect.width - dragRect.width;
    const translateY = overlayRect.height - dragRect.height;
    this.resizeHandleCorner.nativeElement.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)`;
  }
}
