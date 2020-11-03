import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EventDisplayService } from 'phoenix-ui-components';
import { Configuration, PresetView, PhoenixMenuNode, JiveXMLLoader, StateManager } from 'phoenix-event-display';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'app-atlas',
  templateUrl: './atlas.component.html',
  styleUrls: ['./atlas.component.scss']
})
export class AtlasComponent implements OnInit {
  phoenixMenuRoot = new PhoenixMenuNode('Phoenix Menu', 'phoenix-menu');

  constructor(
    private eventDisplay: EventDisplayService,
    private http: HttpClient,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    // Define the configuration
    const configuration = new Configuration();
    configuration.presetViews = [
      new PresetView('Left View', [0, 0, -12000], 'left-cube'),
      new PresetView('Center View', [-500, 12000, 0], 'top-cube'),
      new PresetView('Right View', [0, 0, 12000], 'right-cube')
    ];
    let position: number[] = [1, 2, 3];
    position = [4000, 4000, 4000];
    console.log(configuration.defaultView)
    configuration.defaultView = [4000, 4000, 4000];
    console.log(configuration.defaultView)

    // Set the phoenix menu to be used (defined above)
    configuration.setPhoenixMenuRoot(this.phoenixMenuRoot);

    // Initialize the event display
    this.eventDisplay.init(configuration);

    // // Load the JSON file containing event data
    // this.http.get('assets/files/event_data/atlaseventdump2.json')
    //   .subscribe((res: any) => {
    //     // Parse the JSON to extract events and their data
    //     this.eventDisplay.parsePhoenixEvents(res);
    //   });

    // Load the default JiveXML file
    this.loadEvent();

    // Load detector geometries
    this.eventDisplay
      .loadOBJGeometry('assets/geometry/ATLAS/toroids.obj', 'Toroids', 0x8c8c8c, false, false);
    this.eventDisplay
      .loadOBJGeometry('assets/geometry/ATLAS/TRT.obj', 'TRT', 0x356aa5, false);
    this.eventDisplay
      .loadOBJGeometry('assets/geometry/ATLAS/SCT.obj', 'SCT', 0xfff400, false);
    this.eventDisplay
      .loadOBJGeometry('assets/geometry/ATLAS/pixel.obj', 'Pixel', 0x356aa5, false);
    this.eventDisplay
      .loadOBJGeometry('assets/geometry/ATLAS/LAR_Bar.obj', 'LAr Barrel', 0x19CCD2, true, false);
    this.eventDisplay
      .loadOBJGeometry('assets/geometry/ATLAS/LAR_EC1.obj', 'LAr EC1', 0x19CCD2, true, false);
    this.eventDisplay
      .loadOBJGeometry('assets/geometry/ATLAS/LAR_EC2.obj', 'LAr EC2', 0x19CCD2, true, false);
    this.eventDisplay
      .loadOBJGeometry('assets/geometry/ATLAS/TileCal.obj', 'Tile Cal', 0xc14343, true, false);
  }

  private loadEvent() {
    this.route.queryParams.subscribe(params => {
      let file: string, type: string;
      if (!params['file'] || !params['type']) {
        file = 'assets/files/JiveXML/JiveXML_336567_2327102923.xml';
        type = 'jivexml';
      } else {
        file = params['file'];
        type = params['type'].toLowerCase();
      }

      const resType: any = type === 'jivexml' ? 'text' : 'json';

      this.http.get(file, { responseType: resType }).subscribe((res: any) => {
        if (type === 'jivexml') {
          const loader = new JiveXMLLoader();
          // Parse the JSON to extract events and their data
          loader.process(res);
          const eventData = loader.getEventData();
          this.eventDisplay.buildEventDataFromJSON(eventData);
        } else {
          this.eventDisplay.parsePhoenixEvents(res);
        }

        if (params['config']) {
          this.http.get(params['config']).subscribe(jsonState => {
            const stateManager = new StateManager();
            stateManager.loadStateFromJSON(jsonState);
          });
        }
      }, error => {
        this.eventDisplay.getInfoLogger().add('Could not find the file specified in URL.', 'Error');
        console.error('Could not find the file specified in URL.', error);
      });

    });
  }
}
