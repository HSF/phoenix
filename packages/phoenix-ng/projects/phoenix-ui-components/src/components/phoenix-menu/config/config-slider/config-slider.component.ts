import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-config-slider',
  templateUrl: './config-slider.component.html',
  styleUrls: ['./config-slider.component.scss'],
})
export class ConfigSliderComponent {
  @Input() value: number = 0;
  @Input() min: number = 0;
  @Input() max: number = 100;
  @Input() step: number = 1;
  @Input() allowCustomValue: boolean = false;
  @Output() onChange: EventEmitter<number> = new EventEmitter<number>();

  onValueChange(value: number) {
    if (value) {
      this.onChange.emit(value);
    }
  }
}
