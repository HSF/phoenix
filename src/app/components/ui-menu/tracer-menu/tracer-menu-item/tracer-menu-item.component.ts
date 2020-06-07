import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-tracer-menu-item',
  templateUrl: './tracer-menu-item.component.html',
  styleUrls: ['./tracer-menu-item.component.scss']
})
export class TracerMenuItemComponent implements OnInit {

  @Input() node: { name: string, geometryId: string, children: [] };
  isExpanded = false;
  children: TracerMenuItemComponent[];

  constructor() { }

  ngOnInit(): void {
  }

}
