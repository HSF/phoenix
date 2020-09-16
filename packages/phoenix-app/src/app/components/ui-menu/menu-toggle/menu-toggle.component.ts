import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-menu-toggle',
  templateUrl: './menu-toggle.component.html',
  styleUrls: ['./menu-toggle.component.scss']
})
export class MenuToggleComponent implements OnInit {

  @Input() icon: string;
  @Input() active: boolean;
  @Input() tooltip: string;

  constructor() { }

  ngOnInit() {
  }


}
