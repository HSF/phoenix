import { Component, Input } from '@angular/core';
import {
  EventDataFormat,
  EventDataImportOption,
} from '../../services/extras/event-data-import';
import { defaultAnimationPresets } from './animate-camera/animate-camera.component';

@Component({
  selector: 'app-ui-menu',
  templateUrl: './ui-menu.component.html',
  styleUrls: ['./ui-menu.component.scss'],
})
export class UiMenuComponent {
  @Input()
  eventDataImportOptions: EventDataImportOption[] =
    Object.values(EventDataFormat);
  @Input()
  animationPresets = defaultAnimationPresets;
}
