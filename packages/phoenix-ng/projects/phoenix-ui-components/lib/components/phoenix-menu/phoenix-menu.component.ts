import { Component, Input } from '@angular/core';
import type { PhoenixMenuNode } from 'phoenix-event-display';

@Component({
  selector: 'app-phoenix-menu',
  templateUrl: './phoenix-menu.component.html',
  styleUrls: ['./phoenix-menu.component.scss'],
})
export class PhoenixMenuComponent {
  @Input() rootNode: PhoenixMenuNode;
}
