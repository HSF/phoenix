import { Component, Input, ViewChildren } from '@angular/core';
import type { QueryList } from '@angular/core';
import { EventDisplayService } from '../../../../services/event-display.service';

export type TreeMenuNode = {
  name: string;
  geometryId: string;
  children?: TreeMenuNode[];
};

@Component({
  selector: 'app-tree-menu-item',
  templateUrl: './tree-menu-item.component.html',
  styleUrls: ['./tree-menu-item.component.scss'],
})
export class TreeMenuItemComponent {
  @ViewChildren(TreeMenuItemComponent)
  children!: QueryList<TreeMenuItemComponent>;
  @Input() node: TreeMenuNode;
  isExpanded = false;
  visible = true;

  constructor(private eventDisplay: EventDisplayService) {}

  public toggleVisibility(visible: boolean) {
    console.log("hi! it's " + this.node.name);
    this.eventDisplay
      .getUIManager()
      .geometryVisibility(this.node.geometryId, visible);
    this.visible = visible;
    this.children.forEach((child) => child.toggleVisibility(visible));
  }
}
