import {
  Component,
  type OnInit,
  type OnDestroy,
  ViewChild,
} from '@angular/core';
import { PresetView } from 'phoenix-event-display';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { EventDisplayService } from '../../../services/event-display.service';
import { MatDialog } from '@angular/material/dialog';
import { CartesianGridConfigComponent } from './cartesian-grid-config/cartesian-grid-config.component';
import { Subscription } from 'rxjs';
import { Vector3 } from 'three';
import { MatMenuTrigger } from '@angular/material/menu';

@Component({
  standalone: false,
  selector: 'app-view-options',
  templateUrl: './view-options.component.html',
  styleUrls: ['./view-options.component.scss'],
})
export class ViewOptionsComponent implements OnInit, OnDestroy {
  @ViewChild(MatMenuTrigger) trigger: MatMenuTrigger;
  showCartesianGrid: boolean = false;
  scale: number = 3000;
  views: PresetView[];
  show3DPoints: boolean;
  origin: Vector3 = new Vector3(0, 0, 0);
  sub: Subscription;

  constructor(
    private eventDisplay: EventDisplayService,
    private dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.views = this.eventDisplay.getUIManager().getPresetViews();
    this.sub = this.eventDisplay
      .getThreeManager()
      .originChanged.subscribe((intersect) => {
        this.origin = intersect;
      });
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
    this.eventDisplay
      .getUIManager()
      .setShowCartesianGrid(this.showCartesianGrid, this.scale);
  }

  showLabels(change: MatCheckboxChange) {
    this.eventDisplay.getUIManager().showLabels(change.checked);
  }

  show3DMousePoints(change: MatCheckboxChange) {
    this.show3DPoints = change.checked;
    this.eventDisplay.getUIManager().show3DMousePoints(this.show3DPoints);
  }

  toggleShowDistance(change: MatCheckboxChange) {
    this.trigger.closeMenu();
    this.eventDisplay.getUIManager().show3DDistance(change.checked);
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
