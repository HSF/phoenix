import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import type { PhoenixMenuNode } from 'phoenix-event-display';

@Component({
  standalone: false,
  selector: 'app-phoenix-menu-item',
  templateUrl: './phoenix-menu-item.component.html',
  styleUrls: ['./phoenix-menu-item.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class PhoenixMenuItemComponent {
  @Input() currentNode: PhoenixMenuNode;
  @ViewChild('phoenixMenuItem') phoenixMenuItem: ElementRef<HTMLDivElement>;
  configTop: number;

  constructor(private cdr: ChangeDetectorRef) {}

  /**
   * Whether a node is a leaf holding only configs (like the collections'
   * "Draw/Cut/Color Options"), which is displayed as a compact icon button
   * in a toolbar instead of a full menu row.
   */
  isCompactOptionsNode(node: PhoenixMenuNode): boolean {
    return (
      !!node.icon &&
      !node.onToggle &&
      node.children.length === 0 &&
      node.configs.length > 0
    );
  }

  get isCompact(): boolean {
    return this.isCompactOptionsNode(this.currentNode);
  }

  /** Label for the compact icon button, e.g. "Draw Options" -> "Draw". */
  get compactLabel(): string {
    return this.currentNode.name.replace(/\s+Options$/, '');
  }

  get compactChildren(): PhoenixMenuNode[] {
    return this.currentNode.children.filter((child) =>
      this.isCompactOptionsNode(child),
    );
  }

  get regularChildren(): PhoenixMenuNode[] {
    return this.currentNode.children.filter(
      (child) => !this.isCompactOptionsNode(child),
    );
  }

  calculateConfigTop() {
    if (this.phoenixMenuItem) {
      const itemRect =
        this.phoenixMenuItem.nativeElement.getBoundingClientRect();
      const dragContainer = document.querySelector(
        '.phoenix-menu-drag-container',
      );
      if (dragContainer) {
        const containerRect = dragContainer.getBoundingClientRect();
        this.configTop = itemRect.top - containerRect.top;
      } else {
        this.configTop = itemRect.top;
      }
      this.cdr.detectChanges();
    }
  }

  // Casting to `any` as a workaround to bypass strict template checks.
  castConfigsToAny(configs: PhoenixMenuNode['configs']) {
    return configs as any[];
  }
}
