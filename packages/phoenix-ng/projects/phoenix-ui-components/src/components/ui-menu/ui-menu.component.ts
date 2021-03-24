import { Component, Input } from '@angular/core';
import { EventDataFormat } from '../../types';

@Component({
  selector: 'app-ui-menu',
  templateUrl: './ui-menu.component.html',
  styleUrls: ['./ui-menu.component.scss'],
})
export class UiMenuComponent {
  @Input()
  eventDataFormats: EventDataFormat[] = [];

  hideUIMenu: boolean = false;
}
