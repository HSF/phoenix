import { Component, OnInit } from '@angular/core';
import { UIService } from 'src/app/services/ui.service';

@Component({
  selector: 'app-auto-rotate',
  templateUrl: './auto-rotate.component.html',
  styleUrls: ['./auto-rotate.component.scss']
})
export class AutoRotateComponent implements OnInit {

  autoRotate = false;

  constructor(private ui: UIService) { }

  ngOnInit(): void {
  }

  toggleAutoRotate() {
    this.autoRotate = !this.autoRotate;
    this.ui.setAutoRotate(this.autoRotate);
  }

}
