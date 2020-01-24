import {EventDataLoader} from '../event-data-loader';
import {ThreeService} from '../three.service';
import {UIService} from '../ui.service';
import {PhoenixLoader} from './phoenix-loader';
import { TrackmlLoader } from './trackml-loader';
import { analyzeAndValidateNgModules } from '@angular/compiler';

export class JiveXMLLoader extends PhoenixLoader {
  private data: any;

  constructor() {
    super();
    this.data = {};
  }

  public process(data: any) {
    console.log('Processing JiveXML event data')
    this.data = data;
  }

  public getEventData(): any {

    let parser = new DOMParser();
    const xmlDoc = parser.parseFromString(this.data,"text/xml");

    // Handle multiple events later (if JiveXML even supports this?)
    let firstEvent = xmlDoc.getElementsByTagName("Event")[0];

    const eventData = {
      eventNumber: firstEvent.getAttribute("eventNumber"),
      runNumber: firstEvent.getAttribute("runNumber"),
      Hits: undefined,
      Tracks: {}
    };

    let tracksHTML = firstEvent.getElementsByTagName("Track");
    let tracks = Array.from(tracksHTML)
    const nameOfCollection = "Tracks"
    for (var trackColl of tracks){
        // Extract the only collection we (currently) care about
        if (trackColl.getAttribute("storeGateKey")==nameOfCollection){
            const numOfTracks = Number(trackColl.getAttribute("count"));
            let jsontracks = []

            // The nodes are big strings of numbers, and contain carriage returns. So need to strip all of this, make to array of strings,
            // then convert to array of numbers
            const chi2 = trackColl.getElementsByTagName("chi2")[0].innerHTML.replace(/\r\n|\n|\r/gm," ").trim().split(" ").map(Number);
            const numDoF = trackColl.getElementsByTagName("numDoF")[0].innerHTML.replace(/\r\n|\n|\r/gm," ").trim().split(" ").map(Number);
            const polylineX = trackColl.getElementsByTagName("polylineX")[0].innerHTML.replace(/\r\n|\n|\r/gm," ").trim().split(" ").map(Number);
            const polylineY = trackColl.getElementsByTagName("polylineY")[0].innerHTML.replace(/\r\n|\n|\r/gm," ").trim().split(" ").map(Number);
            const polylineZ = trackColl.getElementsByTagName("polylineZ")[0].innerHTML.replace(/\r\n|\n|\r/gm," ").trim().split(" ").map(Number);
            const numPolyline = trackColl.getElementsByTagName("numPolyline")[0].innerHTML.replace(/\r\n|\n|\r/gm," ").trim().split(" ").map(Number);
            let polylineCounter=0;
            for (let i = 0; i < numOfTracks; i++) {
                let track={chi2: 0.0, dof: 0.0, pos: []};
                track.chi2 = chi2[i];
                track.dof  = numDoF[i];
                let pos = [];
                for (let p = 0; p < numPolyline[i]; p++){
                    pos.push( [ polylineX[polylineCounter+p],polylineY[polylineCounter+p], polylineZ[polylineCounter+p] ] );
                }
                polylineCounter+=numPolyline[i];
                track.pos = pos;
                jsontracks.push(track);
            }
            eventData.Tracks[ trackColl.getAttribute("storeGateKey")] = jsontracks;
        }
    }
    return eventData;
  }
}
