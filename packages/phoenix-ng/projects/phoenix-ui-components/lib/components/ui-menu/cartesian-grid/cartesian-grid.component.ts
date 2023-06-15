import { Component, EventEmitter } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { EventDisplayService } from 'projects/phoenix-ui-components/lib/services/event-display.service';
import { Vector3 } from 'three';

@Component({
  selector: 'app-cartesian-grid',
  templateUrl: './cartesian-grid.component.html',
  styleUrls: ['./cartesian-grid.component.scss'],
})
export class CartesianGridComponent {
  showCartesianGrid: boolean = false;
  showXY: boolean = true;
  showYZ: boolean = true;
  showZX: boolean = true;
  xDistance: number = 0;
  yDistance: number = 0;
  zDistance: number = 0;
  sparsity: number = 1;
  cartesianPos = new Vector3(0, 0, 0);

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
    this.eventDisplay
      .getThreeManager()
      .mainIntersectChanged.subscribe((intersect) => {
        this.translateGrid(intersect);
      });
  }

  shiftCartesianGridByValues(position: Vector3) {
    console.log('oops');
    this.translateGrid(position);
    this.eventDisplay.getThreeManager().mainIntersectChangedEmit(position);
  }

  private translateGrid(position: Vector3) {
    const finalPos = position;
    const initialPos = this.cartesianPos;
    const difference = new Vector3();
    difference.subVectors(finalPos, initialPos);
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
        difference
      );
    this.cartesianPos = finalPos;
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
        this.sparsity
      );
  }
}
