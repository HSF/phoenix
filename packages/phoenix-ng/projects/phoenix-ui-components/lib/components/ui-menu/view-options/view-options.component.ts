import { Component, OnInit } from '@angular/core';
import { PresetView } from 'phoenix-event-display';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { EventDisplayService } from '../../../services/event-display.service';
import { Vector3 } from 'three';

@Component({
  selector: 'app-view-options',
  templateUrl: './view-options.component.html',
  styleUrls: ['./view-options.component.scss'],
})
export class ViewOptionsComponent implements OnInit {
  views: PresetView[];
  show3DPoints: boolean;
  origin: Vector3 = new Vector3(0, 0, 0);

  constructor(private eventDisplay: EventDisplayService) {}

  ngOnInit(): void {
    this.views = this.eventDisplay.getUIManager().getPresetViews();
    this.eventDisplay
      .getThreeManager()
      .mainIntersectChanged.subscribe((intersect) => {
        this.origin = intersect;
      });
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

  show3DMousePoints(change: MatCheckboxChange) {
    this.show3DPoints = change.checked;
    this.eventDisplay
      .getUIManager()
      .show3DMousePoints(this.show3DPoints, this.origin);
  }
}
