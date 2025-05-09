import { Component } from '@angular/core';

@Component({
  standalone: false, // this is now required when using NgModule
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {}
