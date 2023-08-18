import { Component, Inject, OnInit } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EventDisplayService } from '../../../../services/event-display.service';

@Component({
  selector: 'app-cartesian-grid-config',
  templateUrl: './cartesian-grid-config.component.html',
  styleUrls: ['./cartesian-grid-config.component.scss'],
})
export class CartesianGridConfigComponent implements OnInit {
  showCartesianGrid: boolean;
  gridConfig: {
    showXY: boolean;
    showYZ: boolean;
    showZX: boolean;
    xDistance: number;
    yDistance: number;
    zDistance: number;
    sparsity: number;
  };
  scale: number;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { gridVisible: boolean; scale: number },
    private dialogRef: MatDialogRef<CartesianGridConfigComponent>,
    private eventDisplay: EventDisplayService,
  ) {}

  ngOnInit(): void {
    this.showCartesianGrid = this.data.gridVisible;
    this.scale = this.data.scale;
    this.gridConfig = this.eventDisplay.getUIManager().getCartesianGridConfig();
  }

  onClose() {
    this.dialogRef.close();
  }

  addXYPlanes(zDistance: Event) {
    this.gridConfig.zDistance = Number(
      (zDistance.target as HTMLInputElement).value,
    );
    this.callSetShowCartesianGrid();
  }

  addYZPlanes(xDistance: Event) {
    this.gridConfig.xDistance = Number(
      (xDistance.target as HTMLInputElement).value,
    );
    this.callSetShowCartesianGrid();
  }

  addZXPlanes(yDistance: Event) {
    this.gridConfig.yDistance = Number(
      (yDistance.target as HTMLInputElement).value,
    );
    this.callSetShowCartesianGrid();
  }

  changeSparsity(sparsity: Event) {
    this.gridConfig.sparsity = Number(
      (sparsity.target as HTMLInputElement).value,
    );
    this.callSetShowCartesianGrid();
  }

  showXYPlanes(change: MatCheckboxChange) {
    this.gridConfig.showXY = change.checked;
    this.callSetShowCartesianGrid();
  }

  showYZPlanes(change: MatCheckboxChange) {
    this.gridConfig.showYZ = change.checked;
    this.callSetShowCartesianGrid();
  }

  showZXPlanes(change: MatCheckboxChange) {
    this.gridConfig.showZX = change.checked;
    this.callSetShowCartesianGrid();
  }

  callSetShowCartesianGrid() {
    this.eventDisplay
      .getUIManager()
      .setShowCartesianGrid(
        this.showCartesianGrid,
        this.scale,
        this.gridConfig,
      );
  }

  // helper function to calculate number of planes
  calcPlanes(dis: number) {
    return Math.max(
      0,
      1 + 2 * Math.floor((dis * 10) / (this.scale * this.gridConfig.sparsity)),
    );
  }
}
