import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-menu-toggle',
  templateUrl: './menu-toggle.component.html',
  styleUrls: ['./menu-toggle.component.scss'],
})
export class MenuToggleComponent {
  @Input() icon: string;
  @Input() active: boolean;
  @Input() tooltip: string;
  @Input() disabled: boolean = false;
}
