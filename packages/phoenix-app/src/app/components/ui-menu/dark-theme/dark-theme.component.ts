import { Component, OnInit } from '@angular/core';
import { EventDisplayService } from '../../../services/eventdisplay.service';

@Component({
  selector: 'app-dark-theme',
  templateUrl: './dark-theme.component.html',
  styleUrls: ['./dark-theme.component.scss']
})
export class DarkThemeComponent implements OnInit {

  darkTheme = false;

  constructor(private eventDisplay: EventDisplayService) { }

  ngOnInit(): void {
    this.darkTheme = this.eventDisplay.instance.getUIManager().getDarkTheme();
  }

  setDarkTheme() {
    this.darkTheme = !this.darkTheme;
    this.eventDisplay.instance.getUIManager().setDarkTheme(this.darkTheme);
  }

}
