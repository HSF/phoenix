import {
  Component,
  type OnInit,
  ComponentRef,
  type OnDestroy,
} from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { EventBrowserOverlayComponent } from './event-browser-overlay/event-browser-overlay.component';

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
    const overlayRef = this.overlay.create();
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
