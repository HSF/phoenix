import { Component, Input, Output, EventEmitter } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';

@Component({
  selector: 'app-config-slider',
  templateUrl: './config-slider.component.html',
  styleUrls: ['./config-slider.component.scss'],
})
export class ConfigSliderComponent {
  @Input() value: number = 0;
  @Input() min: number = 0;
  oldMin: number = 0;
  @Input() max: number = 100;
  oldMax: number = 0;
  @Input() step: number = 1;
  @Input() allowCustomValue: boolean = false;
  @Output() onChange: EventEmitter<number> = new EventEmitter<number>();

  onValueChange(value: number) {
    value && this.onChange.emit(value);
  }

  toggleMinCut(change: MatCheckboxChange) {
    const value = change.checked;
    if (value) {
      this.min = this.oldMin;
    } else {
      this.oldMin = this.min;
      this.min = Number.MIN_SAFE_INTEGER;
    }
    // We should probably disable the min input too, and change text to be infinity symbol or something?
  }

  toggleMaxCut(change: MatCheckboxChange) {
    const value = change.checked;
    if (value) {
      this.max = this.oldMax;
    } else {
      this.oldMax = this.max;
      this.max = Number.MIN_SAFE_INTEGER;
    }
    // We should probably disable the min input too, and change text to be infinity symbol or something?
  }
}
