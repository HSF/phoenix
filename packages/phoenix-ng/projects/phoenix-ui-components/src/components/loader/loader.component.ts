import { Component } from '@angular/core';
import { EventDisplayService } from '../../services/event-display.service';

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss']
})
export class LoaderComponent {
  loaded = false;

  constructor(private eventDisplay: EventDisplayService) {
    this.eventDisplay.getLoadingManager().addLoadListener(() => {
      this.loaded = true;
    });
  }
}
