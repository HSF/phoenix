import {Component, OnInit} from '@angular/core';
import {EventdisplayService} from '../services/eventdisplay.service';
import {Configuration} from '../services/configuration';
import {HttpClient} from '@angular/common/http';

@Component({
  selector: 'app-playground',
  templateUrl: './playground.component.html',
  styleUrls: ['./playground.component.css']
})
export class PlaygroundComponent implements OnInit {

  fileData = null;

  constructor(private eventDisplay: EventdisplayService) {
  }

  ngOnInit() {
    this.eventDisplay.init(new Configuration());
  }


  handleFileInput(files: any) {
    console.log('handleando');
    const file = files[0];
    const reader = new FileReader();
    if (file.type == 'application/json') {
      reader.onload = () => {
        const json = JSON.parse(reader.result.toString());
        this.eventDisplay.buildEventDataFromJSON(json);
      };
      reader.readAsText(file);
    }
    if (file.name.split('.').pop() == 'obj') {
      reader.onload = () => {
        this.eventDisplay.loadGeometryFromOBJContent(reader.result.toString(), file.name.split('.')[0]);
      };
      reader.readAsText(file);
    } else {
      console.log('Error : ¡¡¡ Archivo no válido !!!');
    }
  }

}
