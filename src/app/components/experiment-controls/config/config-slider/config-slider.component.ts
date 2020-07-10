import { Component, Input, ViewChild } from '@angular/core';

@Component({
  selector: 'app-config-slider',
  templateUrl: './config-slider.component.html',
  styleUrls: ['./config-slider.component.scss']
})
export class ConfigSliderComponent {

  @ViewChild('configSliderInput') configSliderInput;
  @ViewChild('configSlider') configSlider;

  @Input() label: string;
  @Input() min: number = 0;
  @Input() max: number = 100;
  @Input() step: number = 1;
  @Input() allowCustomValue: boolean = false;
  @Input() onChange: (value: number) => void;

  onSliderChange(value: number) {
    if (this.allowCustomValue) {
      this.configSliderInput.nativeElement.value = value;
    }
    this.onChange(value);
  }

  onInputChange(value: number) {
    this.configSlider.value = value;
    this.onChange(value);
  }

}
