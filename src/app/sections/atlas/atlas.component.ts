import {Component, OnInit} from '@angular/core';
import {EventdisplayService} from '../../services/eventdisplay.service';
import {Configuration} from '../../services/extras/configuration.model';
import {PresetView} from '../../services/extras/preset-view.model';
import {HttpClient} from '@angular/common/http';
import {JiveXMLLoader} from '../../services/loaders/jivexml-loader';


@Component({
  selector: 'app-atlas',
  templateUrl: './atlas.component.html',
  styleUrls: ['./atlas.component.scss']
})
export class AtlasComponent implements OnInit {
  // Attributes for displaying the information of selected objects
  hiddenSelectedInfo = true;
  hiddenSelectedInfoBody = true;
  overlayPanel = false;
  showObjectsInfo = false;
  selectedObject: any;
  // Array containing the keys of the multiple loaded events
  events: string[];
  collections: string[];
  showingCollection: any;
  collectionColumns: string[];

  constructor(private eventDisplay: EventdisplayService, private http: HttpClient) {
  }

  ngOnInit() {
    this.selectedObject = {name: 'Object', attributes: []};

    const configuration = new Configuration();
    configuration.presetViews = [
      new PresetView('Left View', [0, 0, -12000], 'left'),
      new PresetView('Center View', [-500, 12000, 0], 'circle'),
      new PresetView('Right View', [0, 0, 12000], 'right')
    ];
    
    this.eventDisplay.init(configuration);
    this.eventDisplay.allowSelection(this.selectedObject);
    this.http.get('assets/files/event_data/atlaseventdump2.json')
      .subscribe((res: any) => this.events = this.eventDisplay.loadEventsFromJSON(res));
    this.eventDisplay.loadGeometryFromOBJ('assets/geometry/ATLASR2/toroids.obj', 'Toroids', 0xaaaaaa, false);
    this.eventDisplay.loadGeometryFromOBJ('assets/geometry/ATLASR2/TRT.obj', 'TRT', 0x356aa5, false);
    this.eventDisplay.loadGeometryFromOBJ('assets/geometry/ATLASR2/SCT.obj', 'SCT', 0xfff400, false);
    this.eventDisplay.loadGeometryFromOBJ('assets/geometry/ATLASR2/pixel.obj', 'Pixel', 0x356aa5, false);
    this.eventDisplay.loadGeometryFromOBJ('assets/geometry/ATLASR2/LAR_Bar.obj', 'LAr Barrel', 0x19CCD2, true);
    this.eventDisplay.loadGeometryFromOBJ('assets/geometry/ATLASR2/LAR_EC1.obj', 'LAr EC1', 0x19CCD2, true);
    this.eventDisplay.loadGeometryFromOBJ('assets/geometry/ATLASR2/LAR_EC2.obj', 'LAr EC2', 0x19CCD2, true);
    this.eventDisplay.loadGeometryFromOBJ('assets/geometry/ATLASR2/TileCal.obj', 'Tile Cal', 0xc14343, true);
  }

  onOptionsSelected(selected: any) {
    const value = selected.target.value;
    this.eventDisplay.loadEvent(value);
  }

  changeCollection(selected: any) {
    const value = selected.target.value;
    this.showingCollection = this.eventDisplay.getCollection(value);
    this.collectionColumns = Object.keys(this.showingCollection[0]);
  }

  handleJSONEventDataInput(files: any) {
    const file = files[0];
    const reader = new FileReader();
    if (file.type === 'application/json') {
      reader.onload = () => {
        const json = JSON.parse(reader.result.toString());
        this.processJSON(json);
      };
      reader.readAsText(file);
    } else {
      console.log('Error : ¡ Invalid file format !');
    }
  }

  processJSON(json: any) {
    this.events = this.eventDisplay.loadEventsFromJSON(json);
    this.collections = this.eventDisplay.getCollections();
  }

  handleJiveXMLEventDataInput(files: any) {
    const file = files[0];
    const reader = new FileReader();
    if (file.type === 'text/xml') {
      reader.onload = () => {
        console.log('Loaded: '+file.name);
        this.processJiveXML(reader.result.toString());
      };
      reader.readAsText(file);
    } else {
      console.log('Error : ¡ Invalid file format !');
    }
  }

  processJiveXML(jive:any) {
    console.log("Got JiveXML.")
    let jiveloader = new JiveXMLLoader();
    jiveloader.process(jive);
    const eventData = jiveloader.getEventData();
    this.eventDisplay.buildEventDataFromJSON(eventData);
  }
}
