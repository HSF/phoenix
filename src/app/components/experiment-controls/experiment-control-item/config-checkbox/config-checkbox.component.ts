import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-config-checkbox',
  templateUrl: './config-checkbox.component.html',
  styleUrls: ['./config-checkbox.component.scss']
})
export class ConfigCheckboxComponent {

  @Input() isChecked: any;
  @Input() configName: string;
  @Input() onChange: (value: boolean) => void;

}
