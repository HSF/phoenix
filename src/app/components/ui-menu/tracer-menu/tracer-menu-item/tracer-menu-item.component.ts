import { Component, AfterViewInit, Input, ViewChildren, QueryList } from '@angular/core';

@Component({
  selector: 'app-tracer-menu-item',
  templateUrl: './tracer-menu-item.component.html',
  styleUrls: ['./tracer-menu-item.component.scss']
})
export class TracerMenuItemComponent implements AfterViewInit {

  @ViewChildren(TracerMenuItemComponent) children!: QueryList<TracerMenuItemComponent>;
  @Input() node: { name: string, geometryId: string, children: [] };
  isExpanded = false;
  visible = true;

  constructor() { }

  ngAfterViewInit(): void {
  }

  public toggleVisibility(visible: boolean) {
    console.log('hi! it\'s ' + this.node.name);
    this.visible = visible;
    this.children.forEach(child => child.toggleVisibility(visible));
  }

}
