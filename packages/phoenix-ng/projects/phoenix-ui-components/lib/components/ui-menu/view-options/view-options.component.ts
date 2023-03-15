import { Component, OnInit } from '@angular/core';
import { PresetView } from 'phoenix-event-display';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { EventDisplayService } from '../../../services/event-display.service';

@Component({
  selector: 'app-view-options',
  templateUrl: './view-options.component.html',
  styleUrls: ['./view-options.component.scss'],
})
export class ViewOptionsComponent implements OnInit {
  views: PresetView[];
  showCartesianGrid: boolean = false;
  showXY: boolean = true;
  showYZ: boolean = true;
  showZX: boolean = true;
  xDistance: number = 0;
  yDistance: number = 0;
  zDistance: number = 0;
  sparsity: number = 1;
  show3DPoints: boolean;

  constructor(private eventDisplay: EventDisplayService) {}

  ngOnInit(): void {
    this.views = this.eventDisplay.getUIManager().getPresetViews();
  }

  displayView($event: any, view: PresetView) {
    $event.stopPropagation();
    this.eventDisplay.getUIManager().displayView(view);
  }

  setAxis(change: MatCheckboxChange) {
    const value = change.checked;
    this.eventDisplay.getUIManager().setShowAxis(value);
  }

  setEtaPhiGrid(change: MatCheckboxChange) {
    const value = change.checked;
    this.eventDisplay.getUIManager().setShowEtaPhiGrid(value);
  }

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

  show3DMousePoints(change: MatCheckboxChange) {
    this.show3DPoints = change.checked;
    this.eventDisplay.getUIManager().show3DMousePoints(this.show3DPoints);
  }
}
