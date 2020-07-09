import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-config-checkbox',
  templateUrl: './config-checkbox.component.html',
  styleUrls: ['./config-checkbox.component.scss']
})
export class ConfigCheckboxComponent {

  @Input() isChecked: any;
  @Input() label: string;
  @Input() onChange: (value: boolean) => void;

}
