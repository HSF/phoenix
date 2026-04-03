import { Component, Input } from '@angular/core';
import {
  EventDataFormat,
  type EventDataImportOption,
} from '../../services/extras/event-data-import';
import { defaultAnimationPresets } from './animate-camera/animate-camera.component';

export interface UIMenuConfig {
  showVRToggle?: boolean;
  showARToggle?: boolean;
  showShareLink?: boolean;
  showPerformanceToggle?: boolean;
  showGeometryBrowser?: boolean;
  showObjectClipping?: boolean;
  showOverlayView?: boolean;
  showAnimateEvent?: boolean;
  showAnimateCamera?: boolean;
  showCollectionsInfo?: boolean;
  showMakePicture?: boolean;
  showObjectSelection?: boolean;
  showInfoPanel?: boolean;
}

export const defaultUIMenuConfig: UIMenuConfig = {
  showVRToggle: true,
  showARToggle: true,
  showShareLink: true,
  showPerformanceToggle: true,
  showGeometryBrowser: true,
  showObjectClipping: true,
  showOverlayView: true,
  showAnimateEvent: true,
  showAnimateCamera: true,
  showCollectionsInfo: true,
  showMakePicture: true,
  showObjectSelection: true,
  showInfoPanel: true,
};

@Component({
  standalone: false,
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

  @Input()
  uiConfig: UIMenuConfig = { ...defaultUIMenuConfig };
}
