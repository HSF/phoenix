import { Component, ComponentRef, OnDestroy, OnInit } from '@angular/core';
import { EventDisplayService } from 'phoenix-ui-components';

@Component({
  selector: 'app-vp-toggle',
  templateUrl: './vp-toggle.component.html',
  styleUrls: ['./vp-toggle.component.scss'],
})
export class VPToggleComponent {
  open = false;

  constructor(private eventDisplay: EventDisplayService) {}

  moveVP(sceneManager, pos) {
    // changes Velo position symetrically by the given amount
    for (const item of ['Modules', 'Support', 'RFFoil', 'DeliveryPipes']) {
      sceneManager
        .getObjectByName('VP > Left > ' + item)
        .position.setComponent(0, pos);
      sceneManager
        .getObjectByName('VP > Right > ' + item)
        .position.setComponent(0, -pos);
    }
  }

  toggleVP() {
    this.open = !this.open;
    this.moveVP(
      this.eventDisplay.getThreeManager().getSceneManager(),
      this.open ? 30 : 0
    );
  }
}
