import { Component, OnInit } from '@angular/core';
import { Configuration } from '../../services/extras/configuration.model';
import { PlaygroundComponent } from '../playground/playground.component';
import { JiveXMLLoader } from '../../services/loaders/jivexml-loader';
import { HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-playground-vr',
  templateUrl: './playground-vr.component.html',
  styleUrls: ['./playground-vr.component.scss']
})
export class PlaygroundVrComponent extends PlaygroundComponent implements OnInit {
  loader: JiveXMLLoader;

  ngOnInit() {
    const configuration = new Configuration();
    this.loader = new JiveXMLLoader();
    this.http.get('assets/files/JiveXML/JiveXML_336567_2327102923.xml', {
      headers: new HttpHeaders()
        .set('Content-Type', 'text/xml')
        .append('Access-Control-Allow-Methods', 'GET')
        .append('Access-Control-Allow-Origin', '*')
        .append('Access-Control-Allow-Headers', "Access-Control-Allow-Headers, Access-Control-Allow-Origin, Access-Control-Request-Method"),
      responseType: 'text'
    }).subscribe((data: any) => {
      // Could this be done better, by immediately converting to JSON?
      this.loader.process(data);
      const eventData = this.loader.getEventData();
      this.eventDisplay.buildEventDataFromJSON(eventData);
    });
    this.eventDisplay.init(configuration);
  }

}
