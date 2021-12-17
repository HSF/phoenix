import { Component, OnInit, ComponentRef, OnDestroy } from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ObjectSelectionOverlayComponent } from './object-selection-overlay/object-selection-overlay.component';
import { EventDisplayService } from '../../../services/event-display.service';

@Component({
  selector: 'app-object-selection',
  templateUrl: './object-selection.component.html',
  styleUrls: ['./object-selection.component.scss'],
})
export class ObjectSelectionComponent implements OnInit, OnDestroy {
  // Attributes for displaying the information of selected objects
  hiddenSelectedInfo = true;
  overlayWindow: ComponentRef<ObjectSelectionOverlayComponent>;

  constructor(
    private overlay: Overlay,
    private eventDisplay: EventDisplayService
  ) {}

  ngOnInit() {
    const overlayRef = this.overlay.create();
    const overlayPortal = new ComponentPortal(ObjectSelectionOverlayComponent);
    this.overlayWindow = overlayRef.attach(overlayPortal);
    this.overlayWindow.instance.hiddenSelectedInfo = this.hiddenSelectedInfo;
  }

  ngOnDestroy(): void {
    this.overlayWindow.destroy();
  }

  toggleOverlay() {
    this.hiddenSelectedInfo = !this.hiddenSelectedInfo;
    this.overlayWindow.instance.hiddenSelectedInfo = this.hiddenSelectedInfo;
    this.eventDisplay.enableSelecting(!this.hiddenSelectedInfo);
  }
}
