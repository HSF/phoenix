import { Component, OnInit, AfterViewChecked, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { UIService } from 'src/app/services/ui.service';

@Component({
  selector: 'app-dark-theme',
  templateUrl: './dark-theme.component.html',
  styleUrls: ['./dark-theme.component.scss']
})
export class DarkThemeComponent implements AfterViewInit {

  darkTheme = false;

  constructor(private ui: UIService, private cd: ChangeDetectorRef) { }

  ngAfterViewInit(): void {
    this.ui.getDarkTheme().subscribe(value => {
      this.darkTheme = value;
      this.cd.detectChanges();
    });
  }

  setDarkTheme() {
    this.darkTheme = !this.darkTheme;
    this.ui.setDarkTheme(this.darkTheme);
  }

}
