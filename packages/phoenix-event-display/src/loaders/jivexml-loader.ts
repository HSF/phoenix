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
      CaloCells: {},
      PlanarCaloCells: {},
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
    this.getRPC(firstEvent, eventData);
    this.getMuonPRD(firstEvent, 'TGC', eventData);
    this.getMuonPRD(firstEvent, 'CSCD', eventData);

    // Tracks
    // (must be filled after hits because it might use them)
    this.getTracks(firstEvent, eventData);

    // Jets
    this.getJets(firstEvent, eventData);

    // Clusters
    this.getCaloClusters(firstEvent, eventData);

    // Cells
    // this.getFCALCaloCells(firstEvent, 'FCAL', eventData);
    this.getCaloCells(firstEvent, 'LAr', eventData);
    this.getCaloCells(firstEvent, 'HEC', eventData);
    this.getCaloCells(firstEvent, 'Tile', eventData);

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
    const elements = collection.getElementsByTagName(key);
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
  public getTracks(
    firstEvent: Element,
    eventData: { Tracks: any; Hits: any }
  ): void {
    const tracksHTML = firstEvent.getElementsByTagName('Track');
    const trackCollections = Array.from(tracksHTML);
    const badTracks = {};

    for (const collection of trackCollections) {
      let trackCollectionName = collection.getAttribute('storeGateKey');
      if (trackCollectionName === 'Tracks') {
        trackCollectionName = 'Tracks_'; //We have problems if the name of the collection is a type
      }

      // if (!trackCollectionName.includes('MuonSpectrometer')) continue;
      const numOfTracks = Number(collection.getAttribute('count'));
      const jsontracks = [];

      // The nodes are big strings of numbers, and contain carriage returns. So need to strip all of this, make to array of strings,
      // then convert to array of numbers
      const tmp = collection.getElementsByTagName('numPolyline');

      let polylineX, polylineY, polylineZ;
      let numPolyline: number[];
      if (tmp.length === 0) {
        console.log(
          'WARNING the track collection ' +
            trackCollectionName +
            ' has no line information. Will rely on Phoenix to extrapolate.'
        );
      } else {
        numPolyline = this.getNumberArrayFromHTML(collection, 'numPolyline');

        const polyLineXHTML = collection.getElementsByTagName('polylineX');

        if (polyLineXHTML.length > 0) {
          polylineX = polyLineXHTML[0].innerHTML
            .replace(/\r\n|\n|\r/gm, ' ')
            .trim()
            .split(' ')
            .map(Number);
          // Assume the rest are okay.
          polylineY = this.getNumberArrayFromHTML(collection, 'polylineY');
          polylineZ = this.getNumberArrayFromHTML(collection, 'polylineZ');
        } else {
          // unset numPolyline so check later is simple (it will all be zeros anyway)
          numPolyline = null;
          polylineX = null;
          polylineY = null;
          polylineZ = null;
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

      // Sanity check of some required quantities
      if (
        numOfTracks != pT.length ||
        numOfTracks != d0.length ||
        numOfTracks != z0.length ||
        numOfTracks != cotTheta.length
      ) {
        console.log(
          'ERROR: Wrong number of some track variables. Corrupted JiveXML?'
        );
      }

      let trackAuthor;
      if (collection.getElementsByTagName('trackAuthor').length) {
        trackAuthor = this.getNumberArrayFromHTML(collection, 'trackAuthor');
      }

      let polylineCounter = 0,
        hitsCounter = 0; // Both of these need to persist throughout the track collection.
      // Sanity check:
      if (numPolyline && numPolyline.length != numOfTracks)
        console.log(
          'numPolyline ',
          numPolyline.length,
          'numOfTracks',
          numOfTracks
        );
      for (let i = 0; i < numOfTracks; i++) {
        let storeTrack = true; // Need to do this because we need to retrieve all info so counters don't go wrong.
        const debugTrack = false;
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
          badtrack: [],
        };
        if (chi2.length >= i) track.chi2 = chi2[i];
        if (numDoF.length >= i) track.dof = numDoF[i];
        if (trackAuthor?.length >= i) track.author = trackAuthor[i];

        let theta = Math.atan(1 / cotTheta[i]);

        track.pT = Math.abs(pT[i]) * 1000; // JiveXML uses GeV
        const momentum = track.pT / Math.sin(theta);
        track.dparams = [d0[i], z0[i], phi0[i], theta, 1.0 / momentum];
        track.phi = phi0[i];

        // if (track.phi == 1.37786) {
        // if (i === 0) {
        //   console.log('Cuplrit found! Index = ', i);
        //   debugTrack = true;
        //   storeTrack = true;
        // }

        if (theta < 0) {
          theta += Math.PI;
          // TODO - check if we need to flip phi here?
        }
        // FIXME - should probably handle this better ... what if phi = 4PI for example?
        if (track.phi > Math.PI) {
          track.phi -= 2.0 * Math.PI;
        } else if (track.phi < -Math.PI) {
          track.phi += 2.0 * Math.PI;
        }

        if (!CoordinateHelper.anglesAreSane(theta, track.phi)) {
          badTracks['Improper angles']++;
          track.badtrack.push('Improper angles');
          storeTrack = false;
        }

        track.eta = CoordinateHelper.thetaToEta(theta);

        if (Number.isNaN(track.eta)) {
          track.badtrack.push('Invalid eta');
          storeTrack = false;
        }

        const pos = [],
          listOfHits = [];
        let maxR = 0.0,
          radius = 0.0,
          x = 0.0,
          y = 0.0,
          z = 0.0;
        if (numPolyline) {
          // Sanity check
          if (
            polylineCounter + numPolyline[i] > polylineX.length ||
            polylineCounter + numPolyline[i] > polylineY.length ||
            polylineCounter + numPolyline[i] > polylineZ.length
          ) {
            console.log(
              'ERROR: not enough points left for this track. Corrupted JiveXML?'
            );
          }
          for (let p = 0; p < numPolyline[i]; p++) {
            x = polylineX[polylineCounter + p] * 10.0;
            y = polylineY[polylineCounter + p] * 10.0;
            z = polylineZ[polylineCounter + p] * 10.0;
            pos.push([x, y, z]);
            radius = Math.sqrt(x * x + y * y + z * z);
            if (radius < maxR) {
              console.log(
                'WARNING: track positions do not seem to be sorted radially'
              );
              badTracks['Hits not sorted']++;
              track.badtrack.push('Hits not sorted');
            }
            if (debugTrack) {
              console.log('pos: ', p, '/', numPolyline[i], ':', pos);
              console.log(
                'theta:',
                theta,
                'theta from hit',
                Math.acos(z / radius)
              );
            }
            maxR = radius;
          }
          polylineCounter += numPolyline[i];
          track.pos = pos;
        }
        if (
          // eslint-disable-next-line no-constant-condition
          false &&
          numHits.length > 0 &&
          trackCollectionName.includes('Muon')
        ) {
          // Disable for the moment.

          // Now loop over hits, and if possible, see if we can extend the track
          const measurementPositions = [];
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
          const sortedMeasurements = measurementPositions.sort(
            (a, b) => a[3] - b[3]
          );
          const minDelta = 250; // tweaked by trial and error
          let newHitCount = 0;
          let rejectedHitCount = 0;
          let lastDistance = maxR + minDelta;
          if (sortedMeasurements.length) {
            for (const meas of sortedMeasurements) {
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

        if (storeTrack) jsontracks.push(track);
      }
      // Final sanity check here
      if (
        numPolyline &&
        (polylineCounter != polylineX.length ||
          polylineCounter != polylineY.length ||
          polylineCounter != polylineZ.length)
      ) {
        console.log(
          'ERROR: something has gone wrong with assigning the positions to the tracks!'
        );
      }

      eventData.Tracks[trackCollectionName] = jsontracks;
      // }
    }
    for (const error in badTracks) {
      if (badTracks[error] > 0)
        console.log(
          badTracks[error] +
            ' tracks had "' +
            error +
            '" and were marked as bad.'
        );
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
      const pixel = { pos: [], id: 0, energyLoss: 0 };
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
      const sct = { pos: [], id: 0, phiModule: 0, side: 0 };
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
      const trt = {
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

    // if (dcHTML.getElementsByTagName('driftR').length > 0) {
    //   const driftR = this.getNumberArrayFromHTML(dcHTML, 'driftR');
    // }

    // if (dcHTML.getElementsByTagName('measuresPhi').length > 0) {
    //   const measuresPhi = this.getNumberArrayFromHTML(dcHTML, 'measuresPhi');
    // }

    const id = this.getNumberArrayFromHTML(dcHTML, 'id');
    const identifier = this.getStringArrayFromHTML(dcHTML, 'identifier');

    eventData.Hits[name] = [];

    for (let i = 0; i < numOfDC; i++) {
      const muonHit = {
        pos: [],
        id: id[i],
        type: 'Line',
        identifier: identifier[i],
      };

      muonHit.pos = this.getMuonLinePositions(i, x, y, z, length);
      eventData.Hits[name].push(muonHit);
    }
  }

  /**
   * Extract RPC measurements from the JiveXML data format and process them.
   * @param firstEvent First "Event" element in the XML DOM of the JiveXML data format.
   * @param eventData Event data object to be updated with TRT Drift Circles.
   */
  public getRPC(firstEvent: Element, eventData: { Hits: any }) {
    const name = 'RPC';
    if (firstEvent.getElementsByTagName(name).length === 0) {
      return;
    }

    const dcHTML = firstEvent.getElementsByTagName(name)[0];

    const numOfDC = Number(dcHTML.getAttribute('count'));
    const x = this.getNumberArrayFromHTML(dcHTML, 'x');
    const y = this.getNumberArrayFromHTML(dcHTML, 'y');
    const z = this.getNumberArrayFromHTML(dcHTML, 'z');
    const length = this.getNumberArrayFromHTML(dcHTML, 'length');
    const width = this.getNumberArrayFromHTML(dcHTML, 'width');
    const id = this.getNumberArrayFromHTML(dcHTML, 'id');
    const identifier = this.getStringArrayFromHTML(dcHTML, 'identifier');

    eventData.Hits[name] = [];

    for (let i = 0; i < numOfDC; i++) {
      const rpcHit = {
        pos: [],
        id: id[i],
        type: 'Line',
        identifier: identifier[i],
        width: width[i],
      };

      rpcHit.pos = this.getMuonLinePositions(i, x, y, z, length);
      //TODO - handle phi measurements
      eventData.Hits[name].push(rpcHit);
    }
  }
  /**
   * Get the end coordinates of a line, given its centre and its length.
   * @param i index of the current coordinate
   * @param x Array of x coordinates
   * @param y Array of y coordinates
   * @param z Array of z coordinates
   * @param length Length of the line (i.e. strip or tube) that we need to draw
   */
  private getMuonLinePositions(
    i: number,
    x: number[],
    y: number[],
    z: number[],
    length: number[]
  ) {
    const radius = Math.sqrt(x[i] * x[i] + y[i] * y[i]);
    const scaling = length[i] / radius;
    // didn't bother multiplying by 10 for radius and length, since they cancel in scaling
    // 2 coords, beginning and end of line
    const pos = [
      x[i] * 10.0 - y[i] * scaling * 5.0,
      y[i] * 10.0 + x[i] * scaling * 5.0,
      z[i] * 10.0,
      x[i] * 10.0 + y[i] * scaling * 5.0,
      y[i] * 10.0 - x[i] * scaling * 5.0,
      z[i] * 10.0,
    ];
    return pos;
  }

  /**
   * Extract Jets from the JiveXML data format and process them.
   * @param firstEvent First "Event" element in the XML DOM of the JiveXML data format.
   * @param eventData Event data object to be updated with Jets.
   */
  public getJets(firstEvent: Element, eventData: { Jets: any }) {
    const jetsHTML = firstEvent.getElementsByTagName('Jet');
    const jetCollections = Array.from(jetsHTML);
    for (const jetColl of jetCollections) {
      const numOfJets = Number(jetColl.getAttribute('count'));

      // The nodes are big strings of numbers, and contain carriage returns. So need to strip all of this, make to array of strings,
      // then convert to array of numbers
      const phi = this.getNumberArrayFromHTML(jetColl, 'phi');
      const eta = this.getNumberArrayFromHTML(jetColl, 'eta');
      const energy = this.getNumberArrayFromHTML(jetColl, 'energy');
      const coneR = this.getNumberArrayFromHTML(jetColl, 'coneR');
      const temp = []; // Ugh
      for (let i = 0; i < numOfJets; i++) {
        temp.push({
          coneR: coneR[i] ?? 0.4, // Set default of 0.4, since some JiveXML files might not have this.
          phi: phi[i],
          eta: eta[i],
          energy: energy[i] * 1000.0,
        });
      }
      eventData.Jets[jetColl.getAttribute('storeGateKey')] = temp;
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
   * Extract Calo Cells from the JiveXML data format and process them.
   * @param firstEvent First "Event" element in the XML DOM of the JiveXML data format.
   * @param eventData Event data object to be updated with Calo Clusters.
   */
  public getFCALCaloCells(
    firstEvent: Element,
    name: string,
    eventData: { PlanarCaloCells: any }
  ) {
    if (firstEvent.getElementsByTagName(name).length === 0) {
      return;
    }
    const dcHTML = firstEvent.getElementsByTagName(name)[0];

    const numOfDC = Number(dcHTML.getAttribute('count'));
    const x = this.getNumberArrayFromHTML(dcHTML, 'x');
    const y = this.getNumberArrayFromHTML(dcHTML, 'y');
    const z = this.getNumberArrayFromHTML(dcHTML, 'z');
    const dx = this.getNumberArrayFromHTML(dcHTML, 'dx');
    const dy = this.getNumberArrayFromHTML(dcHTML, 'dy');
    const dz = this.getNumberArrayFromHTML(dcHTML, 'dz');
    const channel = this.getNumberArrayFromHTML(dcHTML, 'channel');
    const energy = this.getNumberArrayFromHTML(dcHTML, 'energy');
    const id = this.getNumberArrayFromHTML(dcHTML, 'id');
    const slot = this.getStringArrayFromHTML(dcHTML, 'slot');

    eventData.PlanarCaloCells[name] = { cells: [] };

    let oldZ = 0;
    for (let i = 0; i < numOfDC; i++) {
      // Planar Calo cells need:
      // pos
      // length, size
      // and on the collection, a plane

      // Need to handle that some JiveXML is missing z,dz
      const cellz = z.length ? z[i] * 10 : 10;
      const celldz = dz.length ? dz[i] * 10 : dx[i];

      const cell = {
        pos: [x[i] * 10, y[i] * 10, cellz],
        length: celldz,
        cellSize: dx[i] * 10,
        id: id[i],
        slot: slot[i],
        channel: channel[i],
      };

      eventData.PlanarCaloCells[name].cells.push(cell);
      if (oldZ && oldZ != cellz) {
        console.log(
          "WARNING - we're assuming that all cells have the same z. This is apparently not correct!"
        );
      }
      oldZ = cellz;
    }
    eventData.PlanarCaloCells[name].plane = [10, 10, oldZ]; // Just assuming
  }

  /**
   * Extract Calo Cells from the JiveXML data format and process them.
   * @param firstEvent First "Event" element in the XML DOM of the JiveXML data format.
   * @param eventData Event data object to be updated with Calo Clusters.
   */
  public getCaloCells(
    firstEvent: Element,
    name: string = 'FCAL',
    eventData: { CaloCells: any }
  ) {
    if (firstEvent.getElementsByTagName(name).length === 0) {
      return;
    }
    const dcHTML = firstEvent.getElementsByTagName(name)[0];

    const numOfDC = Number(dcHTML.getAttribute('count'));
    const eta = this.getNumberArrayFromHTML(dcHTML, 'eta');
    const phi = this.getNumberArrayFromHTML(dcHTML, 'phi');
    const channel = this.getNumberArrayFromHTML(dcHTML, 'channel');
    const energy = this.getNumberArrayFromHTML(dcHTML, 'energy');
    const id = this.getNumberArrayFromHTML(dcHTML, 'id');
    const slot = this.getStringArrayFromHTML(dcHTML, 'slot');

    eventData.CaloCells[name] = [];

    for (let i = 0; i < numOfDC; i++) {
      const cell = {
        eta: eta[i],
        phi: phi[i],
        id: id[i],
        energy: energy[i],
        channel: channel[i],
      };
      eventData.CaloCells[name].push(cell);
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
        const maxIndex = trackIndex + numTracks[i];
        const thisTrackIndices = [];
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
        const pdgId = this.getNumberArrayFromHTML(collection, 'pdgId');

        temp.push({
          chi2: chi2[i],
          energy: energy[i],
          eta: eta[i],
          phi: phi[i],
          pt: pt[i] * 1000, // JiveXML uses GeV
          pdgId: pdgId[i],
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
        const pdgId = this.getNumberArrayFromHTML(collection, 'pdgId');

        temp.push({
          author: author[i],
          energy: energy[i],
          eta: eta[i],
          phi: phi[i],
          pt: pt[i] * 1000, // JiveXML uses GeV
          pdgId: pdgId[i],
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
          pt: pt[i] * 1000, // JiveXML uses GeV
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
