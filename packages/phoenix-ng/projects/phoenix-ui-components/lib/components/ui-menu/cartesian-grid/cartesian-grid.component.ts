import { Component, OnDestroy, ViewChild } from '@angular/core';
import { MatCheckbox, MatCheckboxChange } from '@angular/material/checkbox';
import { MatMenuTrigger } from '@angular/material/menu';
import { EventDisplayService } from 'projects/phoenix-ui-components/lib/services/event-display.service';
import { Subscription } from 'rxjs';
import { Vector3 } from 'three';

@Component({
  selector: 'app-cartesian-grid',
  templateUrl: './cartesian-grid.component.html',
  styleUrls: ['./cartesian-grid.component.scss'],
})
export class CartesianGridComponent implements OnDestroy {
  @ViewChild(MatMenuTrigger) gridOptionsTrigger: MatMenuTrigger;
  @ViewChild(MatCheckbox) shiftCartesianGridCheckbox: MatCheckbox;

  showCartesianGrid: boolean = false;
  showXY: boolean = true;
  showYZ: boolean = true;
  showZX: boolean = true;
  xDistance: number = 0;
  yDistance: number = 0;
  zDistance: number = 0;
  sparsity: number = 2;
  scale: number = 3000;
  cartesianPos = new Vector3(0, 0, 0);

  originChangedSub: Subscription = null;
  stopShiftingSub: Subscription = null;

  constructor(private eventDisplay: EventDisplayService) {}

  setCartesianGrid(change: MatCheckboxChange) {
    this.showCartesianGrid = change.checked;
    this.callSetShowCartesianGrid();
  }

  addXYPlanes(zDistance: number) {
    this.zDistance = zDistance;
    this.callSetShowCartesianGrid();
  }

  addYZPlanes(xDistance: number) {
    this.xDistance = xDistance;
    this.callSetShowCartesianGrid();
  }

  addZXPlanes(yDistance: number) {
    this.yDistance = yDistance;
    this.callSetShowCartesianGrid();
  }

  changeSparsity(sparsity: number) {
    this.sparsity = sparsity;
    this.callSetShowCartesianGrid();
  }

  showXYPlanes(change: MatCheckboxChange) {
    this.showXY = change.checked;
    this.callSetShowCartesianGrid();
  }

  showYZPlanes(change: MatCheckboxChange) {
    this.showYZ = change.checked;
    this.callSetShowCartesianGrid();
  }

  showZXPlanes(change: MatCheckboxChange) {
    this.showZX = change.checked;
    this.callSetShowCartesianGrid();
  }

  shiftCartesianGridByPointer(change: MatCheckboxChange) {
    this.eventDisplay
      .getUIManager()
      .shiftCartesianGridByPointer(change.checked);
    this.gridOptionsTrigger.closeMenu();
    this.originChangedSub = this.eventDisplay
      .getThreeManager()
      .originChanged.subscribe((intersect) => {
        this.translateGrid(intersect);
      });
    this.stopShiftingSub = this.eventDisplay
      .getThreeManager()
      .stopShifting.subscribe((stop) => {
        if (stop) {
          this.originChangedSub.unsubscribe();
          this.stopShiftingSub.unsubscribe();
        }
      });
  }

  shiftCartesianGridByValues(position: Vector3) {
    this.translateGrid(position);
    this.eventDisplay.getThreeManager().originChangedEmit(position);
  }

  private translateGrid(position: Vector3) {
    const finalPos = position;
    const initialPos = this.cartesianPos;
    const difference = new Vector3();
    difference.subVectors(finalPos, initialPos);
    this.eventDisplay.getUIManager().translateCartesianGrid(difference.clone());
    this.eventDisplay
      .getUIManager()
      .translateCartesianLabels(difference.clone());
    this.cartesianPos = finalPos;
  }

  showLabels(change: MatCheckboxChange) {
    this.eventDisplay.getUIManager().showLabels(change.checked);
  }

  callSetShowCartesianGrid() {
    this.eventDisplay
      .getUIManager()
      .setShowCartesianGrid(
        this.showCartesianGrid,
        this.showXY,
        this.showYZ,
        this.showZX,
        this.xDistance,
        this.yDistance,
        this.zDistance,
        this.sparsity,
        this.scale
      );
  }

  // helper function to calculate number of planes
  calcPlanes(dis: number) {
    return Math.max(
      0,
      1 + 2 * Math.floor((dis * 10) / (this.scale * this.sparsity))
    );
  }

  ngOnDestroy(): void {
    if (this.originChangedSub != null) this.originChangedSub.unsubscribe();
    if (this.stopShiftingSub != null) this.stopShiftingSub.unsubscribe();
  }
}
