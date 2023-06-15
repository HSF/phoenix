import { Component, Output, EventEmitter } from '@angular/core';
import { Vector3 } from 'three';

@Component({
  selector: 'app-view-options-config',
  templateUrl: './view-options-config.component.html',
  styleUrls: ['./view-options-config.component.scss'],
})
export class ViewOptionsConfigComponent {
  @Output() originChanged = new EventEmitter<Vector3>();

  onSave(x, y, z) {
    this.originChanged.emit(new Vector3(x, y, z));
  }
}
