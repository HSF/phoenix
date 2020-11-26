import { AfterContentInit, Component } from '@angular/core';
import { EventDisplayService } from '../../services/event-display.service';

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss']
})
export class LoaderComponent implements AfterContentInit {
  loaded = false;

  constructor(private eventDisplay: EventDisplayService) { }

  ngAfterContentInit() {
    const loadingManager = this.eventDisplay.getLoadingManager();
    if (
      loadingManager.toLoad.length > 0 &&
      loadingManager.toLoad.length !== loadingManager.loaded.length
    ) {
      this.eventDisplay.getLoadingManager().addLoadListener(() => {
        this.loaded = true;
      });
    } else {
      this.loaded = true;
    }
  }
}
