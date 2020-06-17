import { Component, OnInit } from '@angular/core';
import { UIService } from 'src/app/services/ui.service';
import { PresetView } from 'src/app/services/extras/preset-view.model';

@Component({
  selector: 'app-view-options',
  templateUrl: './view-options.component.html',
  styleUrls: ['./view-options.component.scss']
})
export class ViewOptionsComponent implements OnInit {

  views: PresetView[];

  constructor(private ui: UIService) { }

  ngOnInit(): void {
    this.views = this.ui.getPresetViews();
  }

  displayView($event: any, view: PresetView) {
    $event.stopPropagation();
    this.ui.displayView(view);
  }

}
