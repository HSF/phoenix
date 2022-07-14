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

  calculateConfigTop() {
    if (this.phoenixMenuItem) {
      this.configTop =
        this.phoenixMenuItem.nativeElement.getBoundingClientRect().top;
      this.cdr.detectChanges();
    }
  }

  // Casting to `any` as a workaround to bypass strict template checks.
  castConfigsToAny(configs: PhoenixMenuNode['configs']) {
    return configs as any[];
  }
}
