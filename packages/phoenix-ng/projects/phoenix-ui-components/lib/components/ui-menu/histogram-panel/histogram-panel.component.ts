import {
  Component,
  type OnInit,
  ComponentRef,
  type OnDestroy,
  Input,
  type OnChanges,
  type SimpleChanges,
} from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { HistogramPanelOverlayComponent } from './histogram-panel-overlay/histogram-panel-overlay.component';
import type { HistogramConfig } from 'phoenix-event-display';

@Component({
  standalone: false,
  selector: 'app-histogram-panel',
  templateUrl: './histogram-panel.component.html',
  styleUrls: ['./histogram-panel.component.scss'],
})
export class HistogramPanelComponent implements OnInit, OnDestroy, OnChanges {
  showHistogram = false;
  overlayWindow: ComponentRef<HistogramPanelOverlayComponent>;
  @Input() config?: HistogramConfig;

  constructor(private overlay: Overlay) {}

  ngOnInit() {
    const overlayRef = this.overlay.create();
    const overlayPortal = new ComponentPortal(HistogramPanelOverlayComponent);
    this.overlayWindow = overlayRef.attach(overlayPortal);
    this.overlayWindow.instance.showHistogram = this.showHistogram;
    if (this.config) {
      this.overlayWindow.instance.config = this.config;
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['config'] && this.overlayWindow) {
      if (this.config) {
        this.overlayWindow.instance.config = this.config;
      }
    }
  }

  ngOnDestroy(): void {
    this.overlayWindow.destroy();
  }

  toggleOverlay() {
    this.showHistogram = !this.showHistogram;
    this.overlayWindow.instance.showHistogram = this.showHistogram;
  }
}
