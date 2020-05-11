import { Component, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-overlay',
  templateUrl: './overlay.component.html',
  styleUrls: ['./overlay.component.scss']
})
export class OverlayComponent implements AfterViewInit {

  @Input() title: string;
  @Input() active: boolean = false;
  @Input() icon: string;
  @Input() resizable: boolean = false;
  showBody: boolean = true;

  @ViewChild('overlayCard') overlayCard: ElementRef;
  @ViewChild('resizeHandleCorner') resizeHandleCorner: ElementRef;

  ngAfterViewInit() {
    if (this.resizable) {
      const resizeHandleElement = this.resizeHandleCorner.nativeElement;
      resizeHandleElement.style.bottom = '0';
      resizeHandleElement.style.right = '0';
    }
  }

  dragMove() {
    const resizeHandleElement = this.resizeHandleCorner.nativeElement;
    const overlayCardElement = this.overlayCard.nativeElement;

    const dragRect = resizeHandleElement.getBoundingClientRect();
    const targetRect = overlayCardElement.getBoundingClientRect();

    const width = dragRect.left - targetRect.left + dragRect.width;
    const height = dragRect.top - targetRect.top + dragRect.height;

    if ((width > 300 && height > 100)
      && (width < window.innerWidth / 2 && height < window.innerHeight / 1.2)) {
      overlayCardElement.style.width = width + 'px';
      overlayCardElement.style.height = height + 'px';
    }

    const translateX = targetRect.width - dragRect.width;
    const translateY = targetRect.height - dragRect.height;
    resizeHandleElement.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)`;
  }

  removePositionStyles() {
    const resizeHandleElement = this.resizeHandleCorner.nativeElement;
    resizeHandleElement.style.bottom = null;
    resizeHandleElement.style.right = null;
    const overlayCardElement = this.overlayCard.nativeElement;

    const dragRect = resizeHandleElement.getBoundingClientRect();
    const targetRect = overlayCardElement.getBoundingClientRect();
    const translateX = targetRect.width - dragRect.width;
    const translateY = targetRect.height - dragRect.height;
    resizeHandleElement.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)`;
  }

}
