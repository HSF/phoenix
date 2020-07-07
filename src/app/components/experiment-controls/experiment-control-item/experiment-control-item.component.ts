import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-experiment-control-item',
  templateUrl: './experiment-control-item.component.html',
  styleUrls: ['./experiment-control-item.component.scss']
})
export class ExperimentControlItemComponent implements OnInit {

  @Input() icon: string;
  @Input() name: string;
  @Input() children: any[] = [];
  @Input() config: any;

  constructor() { }

  ngOnInit(): void {
  }

}
