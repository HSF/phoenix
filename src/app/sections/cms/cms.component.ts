import { Component, OnInit } from '@angular/core';
import { Configuration } from '../../services/extras/configuration.model';
import { PresetView } from '../../services/extras/preset-view.model';
import { EventdisplayService } from '../../services/eventdisplay.service';
import { HttpClient } from '@angular/common/http';
import JSZip from 'jszip';
import { CMSLoader } from '../../services/loaders/cms-loader';

@Component({
  selector: 'app-cms',
  templateUrl: './cms.component.html',
  styleUrls: ['./cms.component.scss']
})
export class CMSComponent implements OnInit {

  allEvents: string[] = [];
  private archiveLoaded: boolean = false;
  private igArchive = new JSZip();

  constructor(private eventdisplay: EventdisplayService, private http: HttpClient) { }

  ngOnInit(): void {

    const configuration = new Configuration();
    configuration.presetViews = [
      new PresetView('Left View', [0, 0, -12000], 'left-cube'),
      new PresetView('Center View', [-500, 12000, 0], 'top-cube'),
      new PresetView('Right View', [0, 0, 12000], 'right-cube')
    ];

    const cmsLoader = new CMSLoader();
    configuration.eventDataLoader = cmsLoader;

    this.eventdisplay.init(configuration);

    this.readIgArchive('assets/files/cms/phoenix_test.ig', (igArchive: JSZip) => {
      const firstEventPath = Object.keys(igArchive.files).find(fileName => fileName.includes('Event_876295434'));
      this.selectEventFromIg(firstEventPath, igArchive, eventJSON => {
        cmsLoader.putEventData(eventJSON);
        this.eventdisplay.buildEventDataFromJSON(cmsLoader.getEventData());
      });
    });

  }

  readIgArchive(path: string, onFileRead?: (igArchive: JSZip) => void) {
    this.http.get(path, { responseType: 'arraybuffer' }).subscribe((res) => {
      this.igArchive.loadAsync(res).then(() => {
        for (const event of Object.keys(this.igArchive.files)) {
          this.allEvents.push(event);
        }
        this.archiveLoaded = true;
        onFileRead(this.igArchive);
      });
    });
  }

  selectEventFromIg(filePath: string, igArchive: JSZip, onEventLoaded: (eventJSON: any) => void) {
    if (!filePath) console.error('Invalid Filepath');
    else {
      if (this.archiveLoaded) {
        igArchive.file(filePath).async('string').then((val: string) => {
          // The data has some inconsistencies which need to be removed to properly parse JSON
          val = val.replace(/'/g, '"').replace(/\(/g, '[').replace(/\)/g, ']').replace(/nan/g, '0');
          const eventJSON = JSON.parse(val);
          onEventLoaded(eventJSON);
        });
      }
    }
  }

}
