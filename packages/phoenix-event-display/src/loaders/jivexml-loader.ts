import { PhoenixLoader } from './phoenix-loader';
import { CoordinateHelper } from '../helpers/coordinate-helper';

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
      Photons: {},
      MissingEnergy: {},
    };

    // Hits
    this.getPixelClusters(firstEvent, eventData);
    this.getSCTClusters(firstEvent, eventData);
    this.getTRT_DriftCircles(firstEvent, eventData);
    this.getMuonPRD(firstEvent, 'MDT', eventData);
    this.getMuonPRD(firstEvent, 'RPC', eventData);
    this.getMuonPRD(firstEvent, 'TGC', eventData);
    this.getMuonPRD(firstEvent, 'CSCD', eventData);

    // Tracks
    // (must be filled after hits because it might use them)
    this.getTracks(firstEvent, eventData);

    // Jets
    this.getJets(firstEvent, eventData);

    // Clusters
    this.getCaloClusters(firstEvent, eventData);

    // Vertices
    this.getVertices(firstEvent, eventData);

    // MET
    this.getMissingEnergy(firstEvent, eventData);

    // Compound objects
    this.getElectrons(firstEvent, eventData);
    this.getMuons(firstEvent, eventData);
    this.getPhotons(firstEvent, eventData);

    // console.log('Got this eventdata', eventData);
    return eventData;
  }

  /**
   * Get the number array from a collection in XML DOM.
   * @param collection Collection in XML DOM of JiveXML format.
   * @param key Tag name of the number array.
   * @returns Number array.
   */
  private getNumberArrayFromHTML(collection: Element, key: any) {
    // console.log(collection);
    let array = [];
    let elements = collection.getElementsByTagName(key);
    if (elements.length) {
      array = elements[0].innerHTML
        .replace(/\r\n|\n|\r/gm, ' ')
        .trim()
        .split(' ')
        .map(Number);
    }
    return array;
  }

  /**
   * Get the number array from a collection in XML DOM.
   * @param collection Collection in XML DOM of JiveXML format.
   * @param key Tag name of the string array.
   * @returns String array.
   */
  private getStringArrayFromHTML(collection: Element, key: any) {
    return collection
      .getElementsByTagName(key)[0]
      .innerHTML.replace(/\r\n|\n|\r/gm, ' ')
      .trim()
      .split(' ')
      .map(String);
  }
  /**
   * Try to get the position of a hit (i.e. linked from a track)
   * @param hitIdentifier The unique identifier of this hit.
   * @param eventData The complete eventData, which must contain hits.
   * @returns [found, x, y, z].
   */
  private getPositionOfHit(
    hitIdentifier,
    eventData: { Hits: [[{ id: number; pos: any }]] }
  ) {
    for (const hitcollection in eventData.Hits) {
      for (const hit of eventData.Hits[hitcollection]) {
        if (hit == null) {
          console.log('Empty hit');
        } else {
          if ('id' in hit && hit.id == hitIdentifier)
            return [true, hit.pos[0], hit.pos[1], hit.pos[2]];
        }
      }
    }
    return [false, 0, 0, 0];
  }

  /**
   * Extract Tracks from the JiveXML data format and process them.
   * @param firstEvent First "Event" element in the XML DOM of the JiveXML data format.
   * @param eventData Event data object to be updated with Tracks.
   */
  public getTracks(firstEvent: Element, eventData: { Tracks: any; Hits: any }) {
    const tracksHTML = firstEvent.getElementsByTagName('Track');
    const trackCollections = Array.from(tracksHTML);
    const nameOfCollection = 'Tracks';
    for (const collection of trackCollections) {
      let trackCollectionName = collection.getAttribute('storeGateKey');
      if (
        trackCollectionName === 'Tracks' ||
        trackCollectionName === 'GSFTracks' ||
        trackCollectionName === 'GSFTrackParticles'
      ) {
        // Tracks are duplicates of CombinedInDetTracks (though so maybe check that they're in the file before skipping?)
        // GSF tracks cause problems at the moment.
        continue;
      }
      const numOfTracks = Number(collection.getAttribute('count'));
      const jsontracks = [];

      // The nodes are big strings of numbers, and contain carriage returns. So need to strip all of this, make to array of strings,
      // then convert to array of numbers
      const tmp = collection.getElementsByTagName('numPolyline');

      let numPolyline: number[];

      if (tmp.length === 0) {
        // console.log("WARNING the track collection " + trackColl.getAttribute("storeGateKey") + " has no line information. Skipping.");
        // continue;
      } else {
        numPolyline = this.getNumberArrayFromHTML(collection, 'numPolyline');

        const polyLineXHTML = collection.getElementsByTagName('polylineX');
        if (polyLineXHTML.length) {
          // This can happen with e.g. TrackParticles
          var polylineX = polyLineXHTML[0].innerHTML
            .replace(/\r\n|\n|\r/gm, ' ')
            .trim()
            .split(' ')
            .map(Number);
          var polylineY = this.getNumberArrayFromHTML(collection, 'polylineY');
          var polylineZ = this.getNumberArrayFromHTML(collection, 'polylineZ');
        } else {
          // unset numPolyline so check later is simple (it will all be zeros anyway)
          numPolyline = null;
        }
      }

      const chi2 = this.getNumberArrayFromHTML(collection, 'chi2');
      const numDoF = this.getNumberArrayFromHTML(collection, 'numDoF');
      const pT = this.getNumberArrayFromHTML(collection, 'pt');
      const d0 = this.getNumberArrayFromHTML(collection, 'd0');
      const z0 = this.getNumberArrayFromHTML(collection, 'z0');
      const phi0 = this.getNumberArrayFromHTML(collection, 'phi0');
      const cotTheta = this.getNumberArrayFromHTML(collection, 'cotTheta');
      const hits = this.getNumberArrayFromHTML(collection, 'hits');
      const numHits = this.getNumberArrayFromHTML(collection, 'numHits');

      if (collection.getElementsByTagName('trackAuthor').length) {
        var trackAuthor = this.getNumberArrayFromHTML(
          collection,
          'trackAuthor'
        );
      }

      let polylineCounter = 0,
        hitsCounter = 0;
      for (let i = 0; i < numOfTracks; i++) {
        const track = {
          chi2: 0.0,
          dof: 0.0,
          pT: 0.0,
          phi: 0.0,
          eta: 0.0,
          pos: [],
          dparams: [],
          hits: {},
          author: {},
        };
        if (chi2.length >= i) track.chi2 = chi2[i];
        if (numDoF.length >= i) track.dof = numDoF[i];
        if (trackAuthor.length >= i) track.author = trackAuthor[i];
        const theta = Math.tan(cotTheta[i]);
        track.pT = Math.abs(pT[i]);
        const momentum = (pT[i] / Math.sin(theta)) * 1000; // JiveXML uses GeV
        track.dparams = [d0[i], z0[i], phi0[i], theta, 1.0 / momentum];
        track.phi = phi0[i];

        // FIXME - should probably handle this better ... what if phi = 4PI for example?
        if (track.phi > Math.PI) {
          track.phi -= 2.0 * Math.PI;
        } else if (track.phi < -Math.PI) {
          track.phi += 2.0 * Math.PI;
        }

        track.eta = CoordinateHelper.thetaToEta(theta);
        const pos = [],
          listOfHits = [];
        let maxR = 0.0,
          x = 0.0,
          y = 0.0,
          z = 0.0;
        if (numPolyline) {
          for (let p = 0; p < numPolyline[i]; p++) {
            x = polylineX[polylineCounter + p];
            y = polylineY[polylineCounter + p];
            z = polylineZ[polylineCounter + p];
            pos.push([x, y, z]);
            maxR = Math.sqrt(x * x + y * y + z * z);
          }
          polylineCounter += numPolyline[i];
          track.pos = pos;
        }
        if (trackCollectionName.includes('Muon')) {
          // Only try this for Muons at the moment.

          // Now loop over hits, and if possible, see if we can extend the track
          let measurementPositions = [];
          if (numHits.length > 0) {
            let hitIdentifier = 0;
            let distance = 0.0;
            let found = false;
            for (let p = 0; p < numHits[i]; p++) {
              hitIdentifier = hits[hitsCounter + p];
              listOfHits.push(hitIdentifier);
              // Now try to find matching hit
              [found, x, y, z] = this.getPositionOfHit(
                hitIdentifier,
                eventData
              );
              if (found) {
                distance = Math.sqrt(x * x + y * y + z * z);
                if (distance > maxR) {
                  measurementPositions.push([x, y, z, distance]);
                }
              }
            }
            hitsCounter += numHits[i];
            track.hits = listOfHits;
          }

          // This seems to give pretty poor results, so try to filter.
          // Sort radially (sorry cosmics!)
          let sortedMeasurements = measurementPositions.sort(
            (a, b) => a[3] - b[3]
          );
          const minDelta = 250; // tweaked by trial and error
          let newHitCount = 0;
          let rejectedHitCount = 0;
          let lastDistance = maxR + minDelta;
          if (sortedMeasurements.length) {
            for (let meas of sortedMeasurements) {
              if (meas[3] > lastDistance + minDelta) {
                track.pos.push([meas[0], meas[1], meas[2]]);
                lastDistance = meas[3] + minDelta;
                newHitCount++;
              } else {
                rejectedHitCount++;
              }
            }
          }
          console.log(
            'Added ' +
              newHitCount +
              ' hits to ' +
              trackCollectionName +
              ' (and rejected ' +
              rejectedHitCount +
              ')'
          );
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
    if (firstEvent.getElementsByTagName('PixCluster').length === 0) {
      return;
    }
    const pixClustersHTML = firstEvent.getElementsByTagName('PixCluster')[0];
    const numOfClusters = Number(pixClustersHTML.getAttribute('count'));
    const id = this.getNumberArrayFromHTML(pixClustersHTML, 'id');
    const x0 = this.getNumberArrayFromHTML(pixClustersHTML, 'x0');
    const y0 = this.getNumberArrayFromHTML(pixClustersHTML, 'y0');
    const z0 = this.getNumberArrayFromHTML(pixClustersHTML, 'z0');
    const eloss = this.getNumberArrayFromHTML(pixClustersHTML, 'eloss');

    eventData.Hits.Pixel = [];

    for (let i = 0; i < numOfClusters; i++) {
      let pixel = { pos: [], id: 0, energyLoss: 0 };
      pixel.pos = [x0[i] * 10.0, y0[i] * 10.0, z0[i] * 10.0];
      pixel.id = id[i];
      pixel.energyLoss = eloss[i];
      eventData.Hits.Pixel.push(pixel);
    }
  }

  /**
   * Extract SCT Clusters (type of Hits) from the JiveXML data format and process them.
   * @param firstEvent First "Event" element in the XML DOM of the JiveXML data format.
   * @param eventData Event data object to be updated with SCT Clusters.
   */
  public getSCTClusters(firstEvent: Element, eventData: { Hits: any }) {
    if (firstEvent.getElementsByTagName('STC').length === 0) {
      return;
    }

    const sctClustersHTML = firstEvent.getElementsByTagName('STC')[0]; // No idea why this is not SCT!
    const numOfSCTClusters = Number(sctClustersHTML.getAttribute('count'));
    const id = this.getNumberArrayFromHTML(sctClustersHTML, 'id');
    const phiModule = this.getNumberArrayFromHTML(sctClustersHTML, 'phiModule');
    const side = this.getNumberArrayFromHTML(sctClustersHTML, 'side');
    // Commenting out some variables we don't yet use.
    // const width = this.getNumberArrayFromHTML(sctClustersHTML, 'width');
    const x0 = this.getNumberArrayFromHTML(sctClustersHTML, 'x0');
    // const x1 = this.getNumberArrayFromHTML(sctClustersHTML, 'x1');
    const y0 = this.getNumberArrayFromHTML(sctClustersHTML, 'y0');
    // const y1 = this.getNumberArrayFromHTML(sctClustersHTML, 'y1');
    const z0 = this.getNumberArrayFromHTML(sctClustersHTML, 'z0');
    // const z1 = this.getNumberArrayFromHTML(sctClustersHTML, 'z1');
    eventData.Hits.SCT = [];

    for (let i = 0; i < numOfSCTClusters; i++) {
      let sct = { pos: [], id: 0, phiModule: 0, side: 0 };
      sct.pos = [x0[i] * 10.0, y0[i] * 10.0, z0[i] * 10.0];
      sct.id = id[i];
      sct.phiModule = phiModule[i];
      sct.side = side[i];
      eventData.Hits.SCT.push(sct);
    }
  }

  /**
   * Extract TRT Drift Circles (type of Hits) from the JiveXML data format and process them.
   * @param firstEvent First "Event" element in the XML DOM of the JiveXML data format.
   * @param eventData Event data object to be updated with TRT Drift Circles.
   */
  public getTRT_DriftCircles(firstEvent: Element, eventData: { Hits: any }) {
    if (firstEvent.getElementsByTagName('TRT').length === 0) {
      return;
    }

    const dcHTML = firstEvent.getElementsByTagName('TRT')[0];
    const numOfDC = Number(dcHTML.getAttribute('count'));
    // Ignoring bitpattern
    const driftR = this.getNumberArrayFromHTML(dcHTML, 'driftR');
    const id = this.getNumberArrayFromHTML(dcHTML, 'id');
    const noise = this.getNumberArrayFromHTML(dcHTML, 'noise');
    const phi = this.getNumberArrayFromHTML(dcHTML, 'phi');
    const rhoz = this.getNumberArrayFromHTML(dcHTML, 'rhoz');
    const sub = this.getNumberArrayFromHTML(dcHTML, 'sub');
    const threshold = this.getNumberArrayFromHTML(dcHTML, 'threshold');
    const timeOverThreshold = this.getNumberArrayFromHTML(
      dcHTML,
      'timeOverThreshold'
    );

    eventData.Hits.TRT = [];

    // Hardcoding TRT size here. Could maybe think of generalising this?
    for (let i = 0; i < numOfDC; i++) {
      let trt = {
        pos: [],
        id: 0,
        type: 'Line',
        driftR: 0.0,
        threshold: 0.0,
        timeOverThreshold: 0.0,
        noise: false,
      };

      if (sub[i] == 1 || sub[i] == 2) {
        // Barrel - rhoz = radial position
        const z1 = sub[i] == 1 ? -3.5 : 3.5;
        const z2 = sub[i] == 1 ? -742 : 742;
        trt.pos = [
          Math.cos(phi[i]) * rhoz[i] * 10.0,
          Math.sin(phi[i]) * rhoz[i] * 10.0,
          z1,
          Math.cos(phi[i]) * rhoz[i] * 10.0,
          Math.sin(phi[i]) * rhoz[i] * 10.0,
          z2,
        ];
      } else {
        // endcap - rhoz = z position
        const r1 = Math.abs(rhoz[i]) > 280 ? 480 : 640;
        const r2 = 1030;
        trt.pos = [
          Math.cos(phi[i]) * r1,
          Math.sin(phi[i]) * r1,
          rhoz[i] * 10.0,
          Math.cos(phi[i]) * r2,
          Math.sin(phi[i]) * r2,
          rhoz[i] * 10.0,
        ];
      }
      trt.id = id[i];
      trt.driftR = driftR[i];
      trt.noise = noise[i];
      trt.threshold = threshold[i];
      trt.timeOverThreshold = timeOverThreshold[i];
      eventData.Hits.TRT.push(trt);
    }
  }

  /**
   * Extract Muon PRDs (type of Hits) from the JiveXML data format and process them.
   * @param firstEvent First "Event" element in the XML DOM of the JiveXML data format.
   * @param name Event data collection name.
   * @param eventData Event data object to be updated with TRT Drift Circles.
   */
  public getMuonPRD(
    firstEvent: Element,
    name: string,
    eventData: { Hits: any }
  ) {
    if (firstEvent.getElementsByTagName(name).length === 0) {
      return;
    }

    const dcHTML = firstEvent.getElementsByTagName(name)[0];

    // Bit of a nasty hack, but JiveXML stores CSCs as CSCD for some reason.
    if (name == 'CSCD') name = 'CSC';

    const numOfDC = Number(dcHTML.getAttribute('count'));
    const x = this.getNumberArrayFromHTML(dcHTML, 'x');
    const y = this.getNumberArrayFromHTML(dcHTML, 'y');
    const z = this.getNumberArrayFromHTML(dcHTML, 'z');
    const length = this.getNumberArrayFromHTML(dcHTML, 'length');

    if (dcHTML.getElementsByTagName('driftR').length > 0) {
      const driftR = this.getNumberArrayFromHTML(dcHTML, 'driftR');
    }
    const id = this.getNumberArrayFromHTML(dcHTML, 'id');
    const identifier = this.getStringArrayFromHTML(dcHTML, 'identifier');

    eventData.Hits[name] = [];

    let radius = 0.0,
      scaling = 0.0;
    for (let i = 0; i < numOfDC; i++) {
      let muonHit = { pos: [], id: 0, type: 'Line', identifier: '' };

      radius = Math.sqrt(x[i] * x[i] + y[i] * y[i]);
      scaling = length[i] / radius;

      muonHit.pos = [
        x[i] * 10.0 - y[i] * scaling,
        y[i] * 10.0 + x[i] * scaling,
        z[i] * 10.0,
        x[i] * 10.0 + y[i] * scaling,
        y[i] * 10.0 - x[i] * scaling,
        z[i] * 10.0,
      ];
      muonHit.id = id[i];
      muonHit.identifier = identifier[i];
      eventData.Hits[name].push(muonHit);
    }
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
      const phi = this.getNumberArrayFromHTML(jetColl, 'phi');
      const eta = this.getNumberArrayFromHTML(jetColl, 'eta');
      const energy = this.getNumberArrayFromHTML(jetColl, 'energy');

      const temp = []; // Ugh
      for (let i = 0; i < numOfJets; i++) {
        temp.push({
          coneR: 0.4,
          phi: phi[i],
          eta: eta[i],
          energy: energy[i] * 1000.0,
        });
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
  public getCaloClusters(
    firstEvent: Element,
    eventData: { CaloClusters: any }
  ) {
    const clustersHTML = firstEvent.getElementsByTagName('Cluster');
    const clusterCollections = Array.from(clustersHTML);
    const nameOfCollection = 'CaloTopoCluster_ESD';
    for (const clusterColl of clusterCollections) {
      const numOfClusters = Number(clusterColl.getAttribute('count'));

      const phi = this.getNumberArrayFromHTML(clusterColl, 'phi');
      const eta = this.getNumberArrayFromHTML(clusterColl, 'eta');
      const energy = this.getNumberArrayFromHTML(clusterColl, 'et');

      const temp = []; // Ugh
      for (let i = 0; i < numOfClusters; i++) {
        temp.push({ phi: phi[i], eta: eta[i], energy: energy[i] * 1000.0 });
      }
      eventData.CaloClusters[clusterColl.getAttribute('storeGateKey')] = temp;
      // }
    }
  }

  /**
   * Extract Vertices from the JiveXML data format and process them.
   * @param firstEvent First "Event" element in the XML DOM of the JiveXML data format.
   * @param eventData Event data object to be updated with Vertices.
   */
  public getVertices(firstEvent: Element, eventData: { Vertices: any }) {
    const verticesHTML = firstEvent.getElementsByTagName('RVx');
    const vertexCollections = Array.from(verticesHTML);
    for (const vertexColl of vertexCollections) {
      const numOfObjects = Number(vertexColl.getAttribute('count'));

      // The nodes are big strings of numbers, and contain carriage returns. So need to strip all of this, make to array of strings,
      // then convert to array of numbers
      const x = vertexColl
        .getElementsByTagName('x')[0]
        .innerHTML.replace(/\r\n|\n|\r/gm, ' ')
        .trim()
        .split(' ')
        .map(Number);
      const y = vertexColl
        .getElementsByTagName('y')[0]
        .innerHTML.replace(/\r\n|\n|\r/gm, ' ')
        .trim()
        .split(' ')
        .map(Number);
      const z = vertexColl
        .getElementsByTagName('z')[0]
        .innerHTML.replace(/\r\n|\n|\r/gm, ' ')
        .trim()
        .split(' ')
        .map(Number);
      const chi2 = vertexColl
        .getElementsByTagName('chi2')[0]
        .innerHTML.replace(/\r\n|\n|\r/gm, ' ')
        .trim()
        .split(' ')
        .map(Number);
      const primVxCand = vertexColl
        .getElementsByTagName('primVxCand')[0]
        .innerHTML.replace(/\r\n|\n|\r/gm, ' ')
        .trim()
        .split(' ')
        .map(Number);
      const vertexType = vertexColl
        .getElementsByTagName('vertexType')[0]
        .innerHTML.replace(/\r\n|\n|\r/gm, ' ')
        .trim()
        .split(' ')
        .map(Number);
      const numTracks = vertexColl
        .getElementsByTagName('numTracks')[0]
        .innerHTML.replace(/\r\n|\n|\r/gm, ' ')
        .trim()
        .split(' ')
        .map(Number);
      const sgkeyOfTracks = vertexColl
        .getElementsByTagName('sgkey')[0]
        .innerHTML.replace(/\r\n|\n|\r/gm, ' ')
        .trim()
        .split(' ')
        .map(String);
      const trackIndices = vertexColl
        .getElementsByTagName('tracks')[0]
        .innerHTML.replace(/\r\n|\n|\r/gm, ' ')
        .trim()
        .split(' ')
        .map(Number);
      const temp = []; // Ugh
      let trackIndex = 0;
      for (let i = 0; i < numOfObjects; i++) {
        let maxIndex = trackIndex + numTracks[i];
        let thisTrackIndices = [];
        for (; trackIndex < maxIndex; trackIndex++) {
          if (trackIndex > trackIndices.length) {
            console.log(
              'Error! TrackIndex exceeds maximum number of track indices.'
            );
          }
          thisTrackIndices.push(trackIndices[trackIndex]);
        }
        temp.push({
          x: x[i],
          y: y[i],
          z: z[i],
          chi2: chi2[i],
          primVxCand: primVxCand[i],
          vertexType: vertexType[i],
          linkedTracks: thisTrackIndices,
          linkedTrackCollection: sgkeyOfTracks[i],
        });
      }
      eventData.Vertices[vertexColl.getAttribute('storeGateKey')] = temp;
    }
  }

  /**
   * Extract Muons from the JiveXML data format and process them.
   * @param firstEvent First "Event" element in the XML DOM of the JiveXML data format.
   * @param eventData Event data object to be updated with Muons.
   */
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
        temp.push({
          chi2: chi2[i],
          energy: energy[i],
          eta: eta[i],
          phi: phi[i],
          pt: pt[i],
        });
      }
      eventData.Muons[collection.getAttribute('storeGateKey')] = temp;
    }
  }

  /**
   * Extract Electrons from the JiveXML data format and process them.
   * @param firstEvent First "Event" element in the XML DOM of the JiveXML data format.
   * @param eventData Event data object to be updated with Electrons.
   */
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
        temp.push({
          author: author[i],
          energy: energy[i],
          eta: eta[i],
          phi: phi[i],
          pt: pt[i],
        });
      }
      eventData.Electrons[collection.getAttribute('storeGateKey')] = temp;
    }
  }

  /**
   * Extract Photons from the JiveXML data format and process them.
   * @param firstEvent First "Event" element in the XML DOM of the JiveXML data format.
   * @param eventData Event data object to be updated with Photons.
   */
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
        temp.push({
          author: author[i],
          energy: energy[i],
          eta: eta[i],
          phi: phi[i],
          pt: pt[i],
        });
      }
      eventData.Photons[collection.getAttribute('storeGateKey')] = temp;
    }
  }

  /**
   * Extract MET from the JiveXML data format and process them.
   * @param firstEvent First "Event" element in the XML DOM of the JiveXML data format.
   * @param eventData Event data object to be updated with Photons.
   */
  public getMissingEnergy(
    firstEvent: Element,
    eventData: { MissingEnergy: any }
  ) {
    const objHTML = firstEvent.getElementsByTagName('ETMis');
    const objCollections = Array.from(objHTML);
    for (const collection of objCollections) {
      const numOfObjects = Number(collection.getAttribute('count'));
      const temp = []; // Ugh
      for (let i = 0; i < numOfObjects; i++) {
        const et = this.getStringArrayFromHTML(collection, 'et');
        const etx = this.getNumberArrayFromHTML(collection, 'etx');
        const ety = this.getNumberArrayFromHTML(collection, 'ety');

        temp.push({
          et: et[i],
          etx: etx[i],
          ety: ety[i],
        });
      }
      eventData.MissingEnergy[collection.getAttribute('storeGateKey')] = temp;
    }
  }
}
