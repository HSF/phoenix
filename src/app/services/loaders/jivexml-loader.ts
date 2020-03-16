import { EventDataLoader } from '../event-data-loader';
import { ThreeService } from '../three.service';
import { UIService } from '../ui.service';
import { PhoenixLoader } from './phoenix-loader';
import { TrackmlLoader } from './trackml-loader';
import { analyzeAndValidateNgModules } from '@angular/compiler';

export class JiveXMLLoader extends PhoenixLoader {
  private data: any;

  constructor() {
    super();
    this.data = {};
  }

  public process(data: any) {
    console.log('Processing JiveXML event data');
    this.data = data;
  }

  public getEventData(): any {

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(this.data, 'text/xml');

    // Handle multiple events later (if JiveXML even supports this?)
    const firstEvent = xmlDoc.getElementsByTagName('Event')[0];

    const eventData = {
      eventNumber: firstEvent.getAttribute('eventNumber'),
      runNumber: firstEvent.getAttribute('runNumber'),
      Hits: undefined,
      Tracks: {},
      Jets: {},
      CaloClusters: {}
    };

    // Tracks
    this.getTracks(firstEvent, eventData);

    // Hits
    this.getPixelClusters(firstEvent, eventData);
    this.getSCTClusters(firstEvent, eventData);

    // Jets
    this.getJets(firstEvent, eventData);
    this.getCaloClusters(firstEvent, eventData);

    console.log('Got this eventdata', eventData);
    return eventData;
  }

  public getTracks(firstEvent: Element, eventData: { Tracks: any }) {
    const tracksHTML = firstEvent.getElementsByTagName('Track');
    const trackCollections = Array.from(tracksHTML);
    const nameOfCollection = 'Tracks';
    for (const trackColl of trackCollections) {
      // Extract the only collection we (currently) care about
      // if (trackColl.getAttribute("storeGateKey")==nameOfCollection){
      const numOfTracks = Number(trackColl.getAttribute('count'));
      const jsontracks = [];

      // The nodes are big strings of numbers, and contain carriage returns. So need to strip all of this, make to array of strings,
      // then convert to array of numbers
      const numPolyline = trackColl.getElementsByTagName('numPolyline')[0].innerHTML
        .replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
      const chi2 = trackColl.getElementsByTagName('chi2')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
      const numDoF = trackColl.getElementsByTagName('numDoF')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
      const polyLineXHTML = trackColl.getElementsByTagName('polylineX');
      if (polyLineXHTML.length === 0) { continue; } // Probably a trackparticle.
      const polylineX = polyLineXHTML[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
      const polylineY = trackColl.getElementsByTagName('polylineY')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
      const polylineZ = trackColl.getElementsByTagName('polylineZ')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
      const pT = trackColl.getElementsByTagName('pt')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
      const d0 = trackColl.getElementsByTagName('d0')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
      const z0 = trackColl.getElementsByTagName('z0')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
      const phi0 = trackColl.getElementsByTagName('phi0')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
      const cotTheta = trackColl.getElementsByTagName('cotTheta')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
      const author = trackColl.getElementsByTagName('trackAuthor')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
      let polylineCounter = 0;
      for (let i = 0; i < numOfTracks; i++) {
        const track = { chi2: 0.0, dof: 0.0, pos: [], dparams:[] };
        track.chi2 = chi2[i];
        track.dof = numDoF[i];
        track.dparams = [ d0[i], z0[i], phi0[i], Math.tan(cotTheta[i]), 1 / pT[i]];
        const pos = [];
        for (let p = 0; p < numPolyline[i]; p++) {
          pos.push([polylineX[polylineCounter + p], polylineY[polylineCounter + p], polylineZ[polylineCounter + p]]);
        }
        polylineCounter += numPolyline[i];
        track.pos = pos;
        jsontracks.push(track);
      }
      eventData.Tracks[trackColl.getAttribute('storeGateKey')] = jsontracks;
      // }
    }
  }

  public getPixelClusters(firstEvent: Element, eventData: { Hits: any }) {
    eventData.Hits = {};
    if (firstEvent.getElementsByTagName('PixCluster').length === 0) { return; }
    const pixClustersHTML = firstEvent.getElementsByTagName('PixCluster')[0];
    const numOfClusters = Number(pixClustersHTML.getAttribute('count'));

    const x0 = pixClustersHTML.getElementsByTagName('x0')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
    const y0 = pixClustersHTML.getElementsByTagName('y0')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
    const z0 = pixClustersHTML.getElementsByTagName('z0')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);

    eventData.Hits.Pixel = [];
    const temp = []; // Ugh
    for (let i = 0; i < numOfClusters; i++) {
      temp.push([x0[i] * 10.0, y0[i] * 10.0, z0[i] * 10.0]);
    }
    eventData.Hits.Pixel.push(temp);
  }

  public getSCTClusters(firstEvent: Element, eventData: { Hits: any }) {
    if (firstEvent.getElementsByTagName('STC').length === 0) { return; }

    const sctClustersHTML = firstEvent.getElementsByTagName('STC')[0]; // No idea why this is not SCT!
    const numOfSCTClusters = Number(sctClustersHTML.getAttribute('count'));
    const x0 = sctClustersHTML.getElementsByTagName('x0')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
    const y0 = sctClustersHTML.getElementsByTagName('y0')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
    const z0 = sctClustersHTML.getElementsByTagName('z0')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
    eventData.Hits.SCT = [];
    const temp = []; // Ugh
    for (let i = 0; i < numOfSCTClusters; i++) {
      temp.push([x0[i] * 10.0, y0[i] * 10.0, z0[i] * 10.0]);
    }
    eventData.Hits.SCT.push(temp);

  }

  public getTRT_DriftCircles(firstEvent: Element, eventData: { Hits: any }) {
    if (firstEvent.getElementsByTagName('TRT').length === 0) { return; }

    // const dcHTML = firstEvent.getElementsByTagName("TRT")[0];
    // const numOfDC  = Number(dcHTML.getAttribute("count"));
    // const phi = dcHTML.getElementsByTagName("phi")[0].innerHTML.replace(/\r\n|\n|\r/gm," ").trim().split(" ").map(Number);
    // const r = dcHTML.getElementsByTagName("y0")[0].innerHTML.replace(/\r\n|\n|\r/gm," ").trim().split(" ").map(Number);
    // eventData.Hits.TRT=[];
    // let temp = []; // Ugh
    // for (let i = 0; i < numOfDC; i++) {
    //   temp.push ( [ Math.cos(phi[i])*r[i]*10.0, Math.sin(phi[i])*r[i]*10.0, z0[i]*10.0 ] );
    // }
    // eventData.Hits.SCT.push (temp);

  }

  public getJets(firstEvent: Element, eventData: { Jets: any }) {

    const jetsHTML = firstEvent.getElementsByTagName('Jet');
    const jetCollections = Array.from(jetsHTML);
    const nameOfCollection = 'AntiKt4TopoJets';
    for (const jetColl of jetCollections) {
      // Extract the only collection we (currently) care about
      // if (jetColl.getAttribute("storeGateKey")==nameOfCollection){
      const numOfJets = Number(jetColl.getAttribute('count'));
      const jsontracks = [];

      // The nodes are big strings of numbers, and contain carriage returns. So need to strip all of this, make to array of strings,
      // then convert to array of numbers
      const phi = jetColl.getElementsByTagName('phi')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
      const eta = jetColl.getElementsByTagName('eta')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
      const energy = jetColl.getElementsByTagName('et')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
      const temp = []; // Ugh
      for (let i = 0; i < numOfJets; i++) {
        temp.push({ coneR: 0.4, phi: phi[i], eta: eta[i], energy: energy[i] * 1000.0 });
      }
      eventData.Jets[jetColl.getAttribute('storeGateKey')] = temp;
      // }
    }
  }

  public getCaloClusters(firstEvent: Element, eventData: { CaloClusters: any }) {
    const clustersHTML = firstEvent.getElementsByTagName('Cluster');
    const clusterCollections = Array.from(clustersHTML);
    const nameOfCollection = 'CaloTopoCluster_ESD';
    for (const clusterColl of clusterCollections) {
      // Extract the only collection we (currently) care about
      // if (clusterColl.getAttribute("storeGateKey")==nameOfCollection){
      const numOfClusters = Number(clusterColl.getAttribute('count'));
      const jsontracks = [];

      // The nodes are big strings of numbers, and contain carriage returns. So need to strip all of this, make to array of strings,
      // then convert to array of numbers
      const phi = clusterColl.getElementsByTagName('phi')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
      const eta = clusterColl.getElementsByTagName('eta')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
      const energy = clusterColl.getElementsByTagName('et')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
      const temp = []; // Ugh
      for (let i = 0; i < numOfClusters; i++) {
        temp.push({ phi: phi[i], eta: eta[i], energy: energy[i] * 1000.0 });
      }
      eventData.CaloClusters[clusterColl.getAttribute('storeGateKey')] = temp;
      // }
    }
  }
}
