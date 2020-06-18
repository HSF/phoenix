import { Component, AfterViewInit, Input, ViewChildren, QueryList } from '@angular/core';
import { UIService } from 'src/app/services/ui.service';

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

  constructor(private uiService: UIService) { }

  ngAfterViewInit(): void {
  }

  public toggleVisibility(visible: boolean) {
    console.log('hi! it\'s ' + this.node.name);
    this.uiService.geometryVisibility(this.node.geometryId, visible);
    this.visible = visible;
    this.children.forEach(child => child.toggleVisibility(visible));
  }

}
