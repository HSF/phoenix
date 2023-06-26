import { Component, Output, EventEmitter } from '@angular/core';
import { Vector3 } from 'three';

@Component({
  selector: 'app-cartesian-grid-config',
  templateUrl: './cartesian-grid-config.component.html',
  styleUrls: ['./cartesian-grid-config.component.scss'],
})
export class CartesianGridConfigComponent {
  @Output() originChanged = new EventEmitter<Vector3>();

  onSave(x, y, z) {
    this.originChanged.emit(new Vector3(x, y, z));
  }
}
