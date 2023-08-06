import { CartesianGridConfigComponent } from './cartesian-grid-config/cartesian-grid-config.component';
import { Component, OnInit } from '@angular/core';
import { PresetView } from 'phoenix-event-display';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { EventDisplayService } from '../../../services/event-display.service';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-view-options',
  templateUrl: './view-options.component.html',
  styleUrls: ['./view-options.component.scss'],
})
export class ViewOptionsComponent implements OnInit {
  showCartesianGrid: boolean = false;
  scale: number = 3000;
  views: PresetView[];

  constructor(
    private eventDisplay: EventDisplayService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.views = this.eventDisplay.getUIManager().getPresetViews();
  }

  openCartesianGridConfigDialog() {
    this.dialog.open(CartesianGridConfigComponent, {
      data: {
        gridVisible: this.showCartesianGrid,
        scale: this.scale,
      },
      position: {
        bottom: '5rem',
        left: '3rem',
      },
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

  setCartesianGrid(change: MatCheckboxChange) {
    this.showCartesianGrid = change.checked;
    this.callSetShowCartesianGrid();
  }

  private callSetShowCartesianGrid() {
    this.eventDisplay
      .getUIManager()
      .setShowCartesianGrid(this.showCartesianGrid, this.scale);
  }

  showLabels(change: MatCheckboxChange) {
    this.eventDisplay.getUIManager().showLabels(change.checked);
  }
}
