import { Component, type AfterViewInit } from '@angular/core';
import { EventDisplayService } from 'phoenix-ui-components';

@Component({
  standalone: false, // this is now required when using NgModule
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements AfterViewInit {
  year: number;

  constructor(private eventDisplay: EventDisplayService) {
    this.year = new Date().getFullYear();
    this.eventDisplay.getThreeManager().stopAnimationLoop();
  }

  ngAfterViewInit() {
    this.eventDisplay.getUIManager().detectColorScheme();
  }
}
