import {
  Component,
  type OnInit,
  ComponentRef,
  type OnDestroy,
} from '@angular/core';
import { EventBrowserOverlayComponent } from './event-browser-overlay/event-browser-overlay.component';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';

@Component({
  standalone: false,
  selector: 'app-event-browser',
  templateUrl: './event-browser.component.html',
  styleUrls: ['./event-browser.component.scss'],
})
export class EventBrowserComponent implements OnInit, OnDestroy {
  showEventBrowser = false;
  overlayWindow: ComponentRef<EventBrowserOverlayComponent>;

  constructor(private overlay: Overlay) {}

  ngOnInit() {
    const positionStrategy = this.overlay
      .position()
      .global()
      .bottom('15px')
      .right('15px');

    const overlayRef = this.overlay.create({ positionStrategy });
    const overlayPortal = new ComponentPortal(EventBrowserOverlayComponent);
    this.overlayWindow = overlayRef.attach(overlayPortal);
    this.overlayWindow.instance.showEventBrowser = this.showEventBrowser;
  }

  ngOnDestroy(): void {
    this.overlayWindow?.destroy();
  }

  toggleOverlay() {
    this.showEventBrowser = !this.showEventBrowser;
    this.overlayWindow.instance.showEventBrowser = this.showEventBrowser;
  }
}
