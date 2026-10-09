import { Component, Input } from '@angular/core';

@Component({
  standalone: false, // this is now required when using NgModule
  selector: 'app-ui-menu-wrapper',
  templateUrl: './ui-menu-wrapper.component.html',
  styleUrls: ['./ui-menu-wrapper.component.scss'],
})
export class UiMenuWrapperComponent {
  hideUIMenu: boolean = false;

  /** Whether the Ctrl/Cmd+K command palette is mounted (#942). */
  @Input() showCommandPalette = true;
}
