import { Component } from '@angular/core';
import { MatSliderChange } from '@angular/material/slider';
import { UIService } from 'src/app/services/ui.service';
import { MatCheckboxChange } from '@angular/material/checkbox';

@Component({
  selector: 'app-object-clipping',
  templateUrl: './object-clipping.component.html',
  styleUrls: ['./object-clipping.component.scss']
})
export class ObjectClippingComponent {

  clippingEnabled: boolean;

  constructor(private uiService: UIService) { }

  changeClippingAngle(change: MatSliderChange) {
    const angle = change.value;
    this.uiService.rotateClipping(angle);
  }

  toggleClipping(change: MatCheckboxChange) {
    const value = change.checked;
    this.uiService.setClipping(value);
    this.clippingEnabled = value;
  }

}
