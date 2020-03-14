import { Component, OnInit } from '@angular/core';
import {EventdisplayService} from '../../services/eventdisplay.service';
import { UIService } from '../../services/ui.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  constructor(private ui: UIService) {
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.ui.detectColorScheme();
  }

}
