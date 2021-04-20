import { Component, Input } from '@angular/core';
import { EventDataImportOption } from '../../services/extras/event-data-import';

@Component({
  selector: 'app-ui-menu',
  templateUrl: './ui-menu.component.html',
  styleUrls: ['./ui-menu.component.scss'],
})
export class UiMenuComponent {
  @Input()
  eventDataFormats: EventDataImportOption[] = [];

  hideUIMenu: boolean = false;
}
