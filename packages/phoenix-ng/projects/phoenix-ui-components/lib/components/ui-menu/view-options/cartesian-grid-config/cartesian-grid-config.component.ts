import { Component, Inject, type OnInit } from '@angular/core';
import { Vector3 } from 'three';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { EventDisplayService } from '../../../../services/event-display.service';
import { Subscription } from 'rxjs';

@Component({
  standalone: false,
  selector: 'app-cartesian-grid-config',
  templateUrl: './cartesian-grid-config.component.html',
  styleUrls: ['./cartesian-grid-config.component.scss'],
})
export class CartesianGridConfigComponent implements OnInit {
  cartesianPos = new Vector3();
  originChangedSub: Subscription = null;
  stopShiftingSub: Subscription = null;
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
  shiftGrid: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { gridVisible: boolean; scale: number },
    private dialogRef: MatDialogRef<CartesianGridConfigComponent>,
    private eventDisplay: EventDisplayService,
  ) {}

  ngOnInit(): void {
    this.shiftGrid = this.eventDisplay.getThreeManager().shiftGrid;
    this.showCartesianGrid = this.data.gridVisible;
    this.scale = this.data.scale;
    this.gridConfig = this.eventDisplay.getUIManager().getCartesianGridConfig();
    this.cartesianPos = this.eventDisplay.getThreeManager().origin;
  }

  onClose() {
    this.dialogRef.close();
  }

  onSave(x, y, z) {
    this.shiftCartesianGridByValues(new Vector3(x * 10, y * 10, z * 10));
  }

  shiftCartesianGridByPointer() {
    this.shiftGrid = true;
    this.eventDisplay.getUIManager().shiftCartesianGridByPointer();
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
    this.onClose();
  }

  shiftCartesianGridByValues(position: Vector3) {
    this.translateGrid(position);
    this.eventDisplay.getThreeManager().originChangedEmit(position);
  }

  translateGrid(position: Vector3) {
    const finalPos = position;
    const initialPos = this.cartesianPos;
    const difference = new Vector3(
      finalPos.x - initialPos.x,
      finalPos.y - initialPos.y,
      finalPos.z - initialPos.z,
    );
    this.eventDisplay.getUIManager().translateCartesianGrid(difference.clone());
    this.eventDisplay
      .getUIManager()
      .translateCartesianLabels(difference.clone());
    this.cartesianPos = finalPos;
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
