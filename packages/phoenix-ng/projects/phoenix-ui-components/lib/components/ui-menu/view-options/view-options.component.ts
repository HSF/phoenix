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
  xDistance: number = 0;
  yDistance: number = 0;
  zDistance: number = 0;

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
    this.eventDisplay
      .getUIManager()
      .setShowCartesianGrid(
        this.showCartesianGrid,
        this.xDistance,
        this.yDistance,
        this.zDistance
      );
  }

  addXYPlanes(zDistance: number) {
    this.zDistance = zDistance;
    this.eventDisplay
      .getUIManager()
      .setShowCartesianGrid(
        this.showCartesianGrid,
        this.xDistance,
        this.yDistance,
        this.zDistance
      );
  }

  addYZPlanes(xDistance: number) {
    this.xDistance = xDistance;
    this.eventDisplay
      .getUIManager()
      .setShowCartesianGrid(
        this.showCartesianGrid,
        this.xDistance,
        this.yDistance,
        this.zDistance
      );
  }

  addZXPlanes(yDistance: number) {
    this.yDistance = yDistance;
    this.eventDisplay
      .getUIManager()
      .setShowCartesianGrid(
        this.showCartesianGrid,
        this.xDistance,
        this.yDistance,
        this.zDistance
      );
  }
}
