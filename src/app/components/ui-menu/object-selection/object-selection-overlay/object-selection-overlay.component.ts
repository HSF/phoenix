import { Component, OnInit, Input } from '@angular/core';
import { EventdisplayService } from 'src/app/services/eventdisplay.service';

@Component({
  selector: 'app-object-selection-overlay',
  templateUrl: './object-selection-overlay.component.html',
  styleUrls: ['./object-selection-overlay.component.scss']
})
export class ObjectSelectionOverlayComponent implements OnInit {

  // Attributes for displaying the information of selected objects
  @Input() hiddenSelectedInfo: boolean;
  selectedObject = { name: 'Object', attributes: [] };

  constructor(private eventDisplay: EventdisplayService) { }

  ngOnInit() {
    this.eventDisplay.allowSelection(this.selectedObject);
  }

}
