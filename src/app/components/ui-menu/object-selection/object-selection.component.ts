import { Component, OnInit, ComponentRef } from '@angular/core';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ObjectSelectionOverlayComponent } from './object-selection-overlay/object-selection-overlay.component';

@Component({
  selector: 'app-object-selection',
  templateUrl: './object-selection.component.html',
  styleUrls: ['./object-selection.component.scss']
})
export class ObjectSelectionComponent implements OnInit {

  // Attributes for displaying the information of selected objects
  hiddenSelectedInfo = true;
  overlayWindow: ComponentRef<ObjectSelectionOverlayComponent>;

  constructor(private overlay: Overlay) { }

  ngOnInit() {
    const overlayRef = this.overlay.create();
    const overlayPortal = new ComponentPortal(ObjectSelectionOverlayComponent);
    this.overlayWindow = overlayRef.attach(overlayPortal);
    this.overlayWindow.instance.hiddenSelectedInfo = this.hiddenSelectedInfo;
  }

  toggleOverlay() {
    this.hiddenSelectedInfo = !this.hiddenSelectedInfo;
    this.overlayWindow.instance.hiddenSelectedInfo = this.hiddenSelectedInfo;
  }

}
