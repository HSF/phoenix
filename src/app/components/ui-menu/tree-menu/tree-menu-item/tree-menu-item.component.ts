import { Component, Input, ViewChildren, QueryList } from '@angular/core';
import { UIService } from 'src/app/services/ui.service';

@Component({
  selector: 'app-tree-menu-item',
  templateUrl: './tree-menu-item.component.html',
  styleUrls: ['./tree-menu-item.component.scss']
})
export class TreeMenuItemComponent {

  @ViewChildren(TreeMenuItemComponent) children!: QueryList<TreeMenuItemComponent>;
  @Input() node: { name: string, geometryId: string, children: [] };
  isExpanded = false;
  visible = true;

  constructor(private uiService: UIService) { }

  public toggleVisibility(visible: boolean) {
    console.log('hi! it\'s ' + this.node.name);
    this.uiService.geometryVisibility(this.node.geometryId, visible);
    this.visible = visible;
    this.children.forEach(child => child.toggleVisibility(visible));
  }

}
