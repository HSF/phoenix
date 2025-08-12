import { Component, type OnInit } from '@angular/core';

@Component({
  standalone: false, // this is now required when using NgModule
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss'],
})
export class NavComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
