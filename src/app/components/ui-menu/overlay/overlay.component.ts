import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-overlay',
  templateUrl: './overlay.component.html',
  styleUrls: ['./overlay.component.scss']
})
export class OverlayComponent {

  @Input() title: string;
  @Input() active: boolean = false;
  @Input() icon: string;
  showBody: boolean = true;

}
