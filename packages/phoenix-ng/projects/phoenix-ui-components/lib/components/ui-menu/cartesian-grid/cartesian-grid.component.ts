import { Component, OnDestroy } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { EventDisplayService } from 'projects/phoenix-ui-components/lib/services/event-display.service';

@Component({
  selector: 'app-cartesian-grid',
  templateUrl: './cartesian-grid.component.html',
  styleUrls: ['./cartesian-grid.component.scss'],
})
export class CartesianGridComponent implements OnDestroy {
  showCartesianGrid: boolean = false;
  showXY: boolean = true;
  showYZ: boolean = true;
  showZX: boolean = true;
  xDistance: number = 0;
  yDistance: number = 0;
  zDistance: number = 0;
  sparsity: number = 1;

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

  ngOnDestroy(): void {}
}
