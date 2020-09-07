import { Component, OnInit } from '@angular/core';
import { PresetView } from '@phoenix/event-display';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { EventDisplayService } from '../../../services/eventdisplay.service';

@Component({
  selector: 'app-view-options',
  templateUrl: './view-options.component.html',
  styleUrls: ['./view-options.component.scss']
})
export class ViewOptionsComponent implements OnInit {

  views: PresetView[];

  constructor(private eventDisplay: EventDisplayService) { }

  ngOnInit(): void {
    this.views = this.eventDisplay.instance.getUIManager().getPresetViews();
  }

  displayView($event: any, view: PresetView) {
    $event.stopPropagation();
    this.eventDisplay.instance.getUIManager().displayView(view);
  }

  setAxis(change: MatCheckboxChange){
    const value = change.checked;
    this.eventDisplay.instance.getUIManager().setShowAxis(value)
  }

}
