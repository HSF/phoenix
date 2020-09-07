import { Component, OnInit } from '@angular/core';
import { Configuration, PresetView, CMSLoader, ScriptLoader, PhoenixMenuNode } from '@phoenix/event-display';
import { EventDisplayService } from '../../services/eventdisplay.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-cms',
  templateUrl: './cms.component.html',
  styleUrls: ['./cms.component.scss']
})
export class CMSComponent implements OnInit {

  phoenixMenuRoot: PhoenixMenuNode = new PhoenixMenuNode('Phoenix Menu', 'phoenix-menu');

  constructor(private eventDisplay: EventDisplayService, private http: HttpClient) { }

  ngOnInit(): void {

    const configuration = new Configuration();
    configuration.presetViews = [
      new PresetView('Left View', [0, 0, -12000], 'left-cube'),
      new PresetView('Center View', [-500, 12000, 0], 'top-cube'),
      new PresetView('Right View', [0, 0, 12000], 'right-cube')
    ];
    configuration.setPhoenixMenuRoot(this.phoenixMenuRoot);

    const cmsLoader = new CMSLoader();
    configuration.eventDataLoader = cmsLoader;

    this.eventDisplay.instance.init(configuration);

    ScriptLoader.loadJSRootScripts((JSROOT) => {
      this.eventDisplay.instance.loadRootJSONGeometry(JSROOT, 'https://root.cern/js/files/geom/cms.json.gz', 'CMS Detector', 10, true);
    });

    cmsLoader.readIgArchive('assets/files/cms/Hto4l_120-130GeV.ig', (allEvents: any[]) => {
      const allEventsData = cmsLoader.getAllEventsData(allEvents);
      this.eventDisplay.instance.parsePhoenixEvents(allEventsData);
    });

  }

}
