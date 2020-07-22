import { Component, Input } from '@angular/core';
import { PhoenixMenuNode } from './phoenix-menu-node/phoenix-menu-node';

@Component({
  selector: 'app-phoenix-menu',
  templateUrl: './phoenix-menu.component.html',
  styleUrls: ['./phoenix-menu.component.scss']
})
export class PhoenixMenuComponent {

  @Input() rootNode: PhoenixMenuNode;

}
