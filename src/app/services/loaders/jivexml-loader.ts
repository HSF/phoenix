import { PhoenixLoader } from './phoenix-loader';

/**
 * PhoenixLoader for processing and loading an event from the JiveXML data format.
 */
export class JiveXMLLoader extends PhoenixLoader {
  /** Event data in JiveXML data format */
  private data: any;

  /**
   * Constructor for the JiveXMLLoader.
   */
  constructor() {
    super();
    this.data = {};
  }

  /**
   * Process JiveXML data to be used by the class.
   * @param data Event data in JiveXML data format.
   */
  public process(data: any) {
    console.log('Processing JiveXML event data');
    this.data = data;
  }

  /**
   * Get the event data from the JiveXML data format.
   * @returns An object containing all the event data.
   */
  public getEventData(): any {

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(this.data, 'text/xml');

    // Handle multiple events later (if JiveXML even supports this?)
    const firstEvent = xmlDoc.getElementsByTagName('Event')[0];

    const eventData = {
      eventNumber: firstEvent.getAttribute('eventNumber'),
      runNumber: firstEvent.getAttribute('runNumber'),
      lumiBlock: firstEvent.getAttribute('lumiBlock'),
      time: firstEvent.getAttribute('dateTime'),
      Hits: undefined,
      Tracks: {},
      Jets: {},
      CaloClusters: {},
      Vertices: {},
      Electrons: {},
      Muons: {},
      Photons: {}
    };

    // Tracks
    this.getTracks(firstEvent, eventData);

    // Hits
    this.getPixelClusters(firstEvent, eventData);
    this.getSCTClusters(firstEvent, eventData);

    // Jets
    this.getJets(firstEvent, eventData);

    // Clusters
    this.getCaloClusters(firstEvent, eventData);

    // Vertices
    this.getVertices(firstEvent, eventData);

    // Compound objects
    this.getElectrons(firstEvent, eventData);
    this.getMuons(firstEvent, eventData);
    this.getPhotons(firstEvent, eventData);

    // console.log('Got this eventdata', eventData);
    return eventData;
  }

  private getNumberArrayFromHTML(collection: Element, key: any) {
    return collection.getElementsByTagName(key)[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
  }

  private getStringArrayFromHTML(collection: Element, key: any) {
    return collection.getElementsByTagName(key)[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(String);
  }

  /**
   * Extract Tracks from the JiveXML data format and process them.
   * @param firstEvent First "Event" element in the XML DOM of the JiveXML data format.
   * @param eventData Event data object to be updated with Tracks.
   */
  public getTracks(firstEvent: Element, eventData: { Tracks: any }) {
    const tracksHTML = firstEvent.getElementsByTagName('Track');
    
    const trackCollections = Array.from(tracksHTML);
    const nameOfCollection = 'Tracks';
    for (const trackColl of trackCollections) {
      let trackCollectionName = trackColl.getAttribute('storeGateKey')
      if (trackCollectionName === "Tracks") {
        // Okay, this is not so nice, but right now this causes big problems because there is an object type called tracks
        trackCollectionName = "Tracks.";
      }
      const numOfTracks = Number(trackColl.getAttribute('count'));
      const jsontracks = [];

      // The nodes are big strings of numbers, and contain carriage returns. So need to strip all of this, make to array of strings,
      // then convert to array of numbers
      const tmp = trackColl.getElementsByTagName('numPolyline')

      if (tmp.length === 0) {
        console.log("WARNING the track collection " + trackColl.getAttribute("storeGateKey") + " has no line information. Skipping.");
        // continue;
      } else {
        var numPolyline = trackColl.getElementsByTagName('numPolyline')[0].innerHTML
        .replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
 
        const polyLineXHTML = trackColl.getElementsByTagName('polylineX');
        if (polyLineXHTML.length ){
          // This can happen with e.g. TrackParticles
          var polylineX = polyLineXHTML[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
          var polylineY = trackColl.getElementsByTagName('polylineY')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
          var polylineZ = trackColl.getElementsByTagName('polylineZ')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
        } else {
          // unset numPolyline so check later is simple (it will all be zeros anyway)
          numPolyline = null
        }
      }
      
      if (trackColl.getElementsByTagName('chi2').length){
        var chi2 = trackColl.getElementsByTagName('chi2')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
      }
      if (trackColl.getElementsByTagName('numDoF').length){
        var numDoF = trackColl.getElementsByTagName('numDoF')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
      }
      const pT = trackColl.getElementsByTagName('pt')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
      const d0 = trackColl.getElementsByTagName('d0')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
      const z0 = trackColl.getElementsByTagName('z0')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
      const phi0 = trackColl.getElementsByTagName('phi0')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
      const cotTheta = trackColl.getElementsByTagName('cotTheta')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
      if (trackColl.getElementsByTagName('numDoF').length){
        var author = trackColl.getElementsByTagName('trackAuthor')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
      }
      let polylineCounter = 0;
      for (let i = 0; i < numOfTracks; i++) {
        const track = { chi2: 0.0, dof: 0.0, pos: [], dparams: [] };
        track.chi2 = chi2[i];
        track.dof = numDoF[i];
        track.dparams = [d0[i], z0[i], phi0[i], Math.tan(cotTheta[i]), 1 / pT[i]];
        const pos = [];
        if (numPolyline){
          for (let p = 0; p < numPolyline[i]; p++) {
            pos.push([polylineX[polylineCounter + p], polylineY[polylineCounter + p], polylineZ[polylineCounter + p]]);
          }
          polylineCounter += numPolyline[i];
          track.pos = pos;
        }
        jsontracks.push(track);
      }

      eventData.Tracks[trackCollectionName] = jsontracks;
      // }
    }
  }

  /**
   * Extract Pixel Clusters (type of Hits) from the JiveXML data format and process them.
   * @param firstEvent First "Event" element in the XML DOM of the JiveXML data format.
   * @param eventData Event data object to be updated with Pixel Clusters.
   */
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

  /**
   * Extract SCT Clusters (type of Hits) from the JiveXML data format and process them.
   * @param firstEvent First "Event" element in the XML DOM of the JiveXML data format.
   * @param eventData Event data object to be updated with SCT Clusters.
   */
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

  /**
   * Extract TRT Drift Circles (type of Hits) from the JiveXML data format and process them.
   * @param firstEvent First "Event" element in the XML DOM of the JiveXML data format.
   * @param eventData Event data object to be updated with TRT Drift Circles.
   */
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

  /**
   * Extract Jets from the JiveXML data format and process them.
   * @param firstEvent First "Event" element in the XML DOM of the JiveXML data format.
   * @param eventData Event data object to be updated with Jets.
   */
  public getJets(firstEvent: Element, eventData: { Jets: any }) {

    const jetsHTML = firstEvent.getElementsByTagName('Jet');
    const jetCollections = Array.from(jetsHTML);
    const nameOfCollection = 'AntiKt4TopoJets';
    for (const jetColl of jetCollections) {
      // Extract the only collection we (currently) care about
      // if (jetColl.getAttribute("storeGateKey")==nameOfCollection){
      const numOfJets = Number(jetColl.getAttribute('count'));

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

  /**
   * Extract Calo Clusters from the JiveXML data format and process them.
   * @param firstEvent First "Event" element in the XML DOM of the JiveXML data format.
   * @param eventData Event data object to be updated with Calo Clusters.
   */
  public getCaloClusters(firstEvent: Element, eventData: { CaloClusters: any }) {
    const clustersHTML = firstEvent.getElementsByTagName('Cluster');
    const clusterCollections = Array.from(clustersHTML);
    const nameOfCollection = 'CaloTopoCluster_ESD';
    for (const clusterColl of clusterCollections) {
      // Extract the only collection we (currently) care about
      // if (clusterColl.getAttribute("storeGateKey")==nameOfCollection){
      const numOfClusters = Number(clusterColl.getAttribute('count'));

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

  public getVertices(firstEvent: Element, eventData: { Vertices: any }) {
    const verticesHTML = firstEvent.getElementsByTagName('RVx');
    const vertexCollections = Array.from(verticesHTML);
    for (const vertexColl of vertexCollections) {
      const numOfObjects = Number(vertexColl.getAttribute('count'));

      // The nodes are big strings of numbers, and contain carriage returns. So need to strip all of this, make to array of strings,
      // then convert to array of numbers
      const x = vertexColl.getElementsByTagName('x')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
      const y = vertexColl.getElementsByTagName('y')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
      const z = vertexColl.getElementsByTagName('z')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
      const chi2 = vertexColl.getElementsByTagName('chi2')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
      const primVxCand = vertexColl.getElementsByTagName('primVxCand')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
      const vertexType = vertexColl.getElementsByTagName('vertexType')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
      const numTracks = vertexColl.getElementsByTagName('numTracks')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
      const sgkeyOfTracks = vertexColl.getElementsByTagName('sgkey')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(String);
      const trackIndices = vertexColl.getElementsByTagName('tracks')[0].innerHTML.replace(/\r\n|\n|\r/gm, ' ').trim().split(' ').map(Number);
      const temp = []; // Ugh
      let trackIndex=0;
      for (let i = 0; i < numOfObjects; i++) {
        let maxIndex = trackIndex+numTracks[i];
        let thisTrackIndices = [];
        for ( ; trackIndex<maxIndex; trackIndex++){
          if (trackIndex>trackIndices.length) {
            console.log("Error! TrackIndex exceeds maximum number of track indices.");
          }
          thisTrackIndices.push(trackIndices[trackIndex]);
        }
        temp.push({ x: x[i], y: y[i], z: z[i], chi2: chi2[i], primVxCand: primVxCand[i], 
          vertexType: vertexType[i], linkedTracks: thisTrackIndices, linkedTrackCollection: sgkeyOfTracks[i]});
      }
      eventData.Vertices[vertexColl.getAttribute('storeGateKey')] = temp;
    }
  }

  public getMuons(firstEvent: Element, eventData: { Muons: any }) {
    const objHTML = firstEvent.getElementsByTagName('Muon');
    const objCollections = Array.from(objHTML);
    for (const collection of objCollections) {
      const numOfObjects = Number(collection.getAttribute('count'));
      const temp = []; // Ugh
      for (let i = 0; i < numOfObjects; i++) {
        const chi2 = this.getNumberArrayFromHTML(collection, 'chi2');
        const energy = this.getNumberArrayFromHTML(collection, 'energy');
        const eta = this.getNumberArrayFromHTML(collection, 'eta');
        const phi = this.getNumberArrayFromHTML(collection, 'phi');
        const pt = this.getNumberArrayFromHTML(collection, 'pt');
        temp.push({ chi2: chi2[i], energy: energy[i], eta: eta[i], phi: phi[i], pt: pt[i]});
      }
      eventData.Muons[collection.getAttribute('storeGateKey')] = temp;
    }
  }

  public getElectrons(firstEvent: Element, eventData: { Electrons: any }) {
    const objHTML = firstEvent.getElementsByTagName('Electron');
    const objCollections = Array.from(objHTML);
    for (const collection of objCollections) {
      const numOfObjects = Number(collection.getAttribute('count'));
      const temp = []; // Ugh
      for (let i = 0; i < numOfObjects; i++) {
        const author = this.getStringArrayFromHTML(collection, 'author');
        const energy = this.getNumberArrayFromHTML(collection, 'energy');
        const eta = this.getNumberArrayFromHTML(collection, 'eta');
        const phi = this.getNumberArrayFromHTML(collection, 'phi');
        const pt = this.getNumberArrayFromHTML(collection, 'pt');
        temp.push({ author: author[i], energy: energy[i], eta: eta[i], phi: phi[i], pt: pt[i]});
      }
      eventData.Electrons[collection.getAttribute('storeGateKey')] = temp;
    }
  }
  public getPhotons(firstEvent: Element, eventData: { Photons: any }) {
    const objHTML = firstEvent.getElementsByTagName('Photon');
    const objCollections = Array.from(objHTML);
    for (const collection of objCollections) {
      const numOfObjects = Number(collection.getAttribute('count'));
      const temp = []; // Ugh
      for (let i = 0; i < numOfObjects; i++) {
        const author = this.getStringArrayFromHTML(collection, 'author');
        const energy = this.getNumberArrayFromHTML(collection, 'energy');
        const eta = this.getNumberArrayFromHTML(collection, 'eta');
        const phi = this.getNumberArrayFromHTML(collection, 'phi');
        const pt = this.getNumberArrayFromHTML(collection, 'pt');
        temp.push({ author: author[i], energy: energy[i], eta: eta[i], phi: phi[i], pt: pt[i]});
      }
      eventData.Photons[collection.getAttribute('storeGateKey')] = temp;
    }
  }
}
