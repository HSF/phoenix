import {EventDataLoader} from './event-data-loader';
import {Group, Object3D, Scene, Vector3} from 'three';
import * as THREE from 'three';
import {UIService} from '../ui.service';
import {ThreeService} from '../three.service';
import {Cut} from '../extras/cut.model';

export class PhoenixLoader implements EventDataLoader {
  private graphicsLibrary: ThreeService;
  private ui: UIService;
  private eventData: any;


  public buildEventsList(eventsData: any): string[]{
    const eventsList: string[] = [];

    for (const eventName of Object.keys(eventsData)) {
      if (eventsData[eventName] !== null) eventsList.push(eventName);
    }

    return eventsList;
  }

  public buildCollectionsList(object: any): string[]{
    const collectionsList: string[] = [];

    for (const collectionName of Object.keys(object)) {
      if(object[collectionName] !== null) collectionsList.push(collectionName);
    }

    return collectionsList;
  }


  public buildEventData(eventData: any, graphicsLibrary: ThreeService, ui: UIService): void {
    this.graphicsLibrary = graphicsLibrary;
    this.ui = ui;
    this.eventData = eventData;

    // initiate load
    this.loadObjectTypes(eventData);
  }

  private loadObjectTypes(eventData: any) {
    if (eventData.Tracks) {
      const cuts: Cut[] = [
        new Cut('chi2', 0, 50),
        new Cut('dof', 0, 100),
        new Cut('mementum', 0, 500)
      ];

      this.addObject(eventData.Tracks, this.addTrack, 'Tracks', cuts);
    }

    if (eventData.Jets) {
      const cuts = [
        new Cut('phi', -Math.PI, Math.PI),
        new Cut('eta', 0, 100),
        new Cut('energy', 2000, 10000)
      ];

      this.addObject(eventData.Jets, this.addJet, 'Jets', cuts);
    }

    if (eventData.Hits) {
      this.addObject(eventData.Hits, this.addHits, 'Hits');
    }

    if (eventData.CaloClusters) {
      const cuts = [
        new Cut('phi', -Math.PI, Math.PI),
        new Cut('eta', 0, 100),
        new Cut('energy', 2000, 10000)
      ];

      this.addObject(eventData.CaloClusters, this.addCluster, 'CaloClusters', cuts);
    }

    if (eventData.Muons) {
      this.addObject(eventData.Muons, this.addMuon, 'Muons');
    }
  }

  private addObject(object: any, addObject: any, objectType: string, cuts?: Cut[]) {

    const typeFolder = this.ui.addEventDataTypeFolder(objectType);
    const objectGroup = this.graphicsLibrary.addEventDataTypeGroup(objectType);

    const collectionsList: string[] = this.buildCollectionsList(object);


    for (const collectionName of collectionsList) {
      const objectCollection = object[collectionName];

      this.addCollection(objectCollection, collectionName, addObject, objectGroup);
      this.ui.addCollection(typeFolder, collectionName, cuts);
    }
  }

  private addCollection(objectCollection: any, collectionName: string, addObject: (object: any, scene: Object3D) => void, objectGroup: Group) {
    const collscene = new THREE.Group();
    collscene.name = collectionName;

    for (const object of objectCollection) {
      addObject.bind(this)(object, collscene);
    }

    objectGroup.add(collscene);
  }

  protected addTrack(track: any, scene: Object3D): void {
    const positions = track.pos;
    // Track with no points
    if (!positions) {
      return;
    }

    const numPoints = positions.length;
    // Track with too few points
    if (numPoints < 3) {
      return;
    }

    // Now sort these.
    positions.sort((a, b) => {
      const distA = a[0] * a[0] + a[1] * a[1] + a[2] * a[2];
      const distB = b[0] * b[0] + b[1] * b[1] + b[2] * b[2];
      
      return distA - distB;
    });

    //const length = 100;
    let color;
    if (track.color) {
      color = parseInt(track.color, 16);
    }else{
      color = 0xff0000
    }

    // Apply pT cut TODO - make this configurable.
    const momentum = track.mom;
    if (momentum) {
      if (momentum[0] * momentum[0] + momentum[1] * momentum[1] + momentum[2] * momentum[2] < 0.25) {
        // console.log('Track mom<0.5 GeV. Skipping. Positions are: ' + positions + ' particle_id: ' + track.particle_id);
        return;
      }
    }

    const points = [];

    for (let i = 0; i < numPoints; i++) {
      points.push(new THREE.Vector3(positions[i][0], positions[i][1], positions[i][2]));
    }

    // attributes
    const curve = new THREE.CatmullRomCurve3(points);
    const vertices = curve.getPoints(50);
    // geometry
    const geometry = new THREE.BufferGeometry().setFromPoints(vertices);
    // material
    const material = new THREE.LineBasicMaterial({color: color});
    material.linewidth = 2;
    // object
    const splineObject = new THREE.Line(geometry, material);
    splineObject.userData = track;
    splineObject.name = 'Track';
    // add to scene
    scene.add(splineObject);
  }

  protected addJet(jet: any, scene: Object3D): void {
    const eta = jet.eta;
    const phi = jet.phi;
    const theta = 2 * Math.atan(Math.pow(Math.E, eta));
    const length = jet.energy * 0.2;
    const width = length * 0.1;

    const sphi = Math.sin(phi);
    const cphi = Math.cos(phi);
    const stheta = Math.sin(theta);
    const ctheta = Math.cos(theta);
    //
    const translation = new THREE.Vector3(0.5 * length * cphi * stheta, 0.5 * length * sphi * stheta, 0.5 * length * ctheta);

    const x = cphi * stheta;
    const y = sphi * stheta;
    const z = ctheta;
    const v1 = new THREE.Vector3(0, 1, 0);
    const v2 = new THREE.Vector3(x, y, z);
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(v1, v2);

    const geometry = new THREE.CylinderGeometry(width, 1, length, 50, 50, false); // Cone

    const material = new THREE.MeshBasicMaterial({color: 0x2194CE, opacity: 0.3, transparent: true});
    material.opacity = 0.5;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(translation);
    mesh.quaternion.copy(quaternion);
    mesh.userData = jet;
    mesh.name = 'Jet';
    scene.add(mesh);
  }

  protected addHits(hits: any, scene: Object3D): void {
    // attributes
    const pointPos = new Float32Array(hits.length * 3);
    let i = 0;
    for (const hit of hits) {
      pointPos[i] = hit[0];
      pointPos[i + 1] = hit[1];
      pointPos[i + 2] = hit[2];
      i += 3;
    }

    // geometry
    const geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.BufferAttribute(pointPos, 3));
    geometry.computeBoundingSphere();
    // material
    const material = new THREE.PointsMaterial({size: 10});
    material.color.set('#ff0000');
    // object
    const pointsObj = new THREE.Points(geometry, material);
    pointsObj.userData = hits;
    pointsObj.name = 'Hit';
    // add to scene
    scene.add(pointsObj);
  }

  protected addCluster(cluster: any, scene: Object3D): void {
    const maxR = 1100.0;
    const maxZ = 3200.0;
    const length = cluster.energy * 0.003;
    // geometry
    const geometry = new THREE.BoxGeometry(30, 30, length);
    // material
    const material = new THREE.MeshBasicMaterial({color: Math.random() * 0xffffff});
    // object
    const cube = new THREE.Mesh(geometry, material);
    const theta = 2 * Math.atan(Math.pow(Math.E, cluster.eta));
    const pos = new THREE.Vector3(4000.0 * Math.cos(cluster.phi) * Math.sin(theta),
      4000.0 * Math.sin(cluster.phi) * Math.sin(theta),
      4000.0 * Math.cos(theta));
    cube.position.x = pos.x;
    cube.position.y = pos.y;
    if (pos.x * pos.x + pos.y * pos.y > maxR * maxR) {
      cube.position.x = maxR * Math.cos(cluster.phi);
      cube.position.y = maxR * Math.sin(cluster.phi);
    }
    cube.position.z = Math.max(Math.min(pos.z, maxZ), -maxZ); // keep in maxZ range.
    cube.lookAt(new THREE.Vector3(0, 0, 0));
    cube.userData = cluster;
    cube.name = 'Cluster';
    // add to scene
    scene.add(cube);
  }

  protected addMuon(muon: any, scene: Scene): void {
    const muonScene = new Group();

    for (const clusterID of muon.LinkedClusters) {
      const clusterColl = clusterID.split(':')[0];
      const clusterIndex = clusterID.split(':')[1];

      if (clusterColl && clusterIndex && this.eventData.CaloClusters && this.eventData.CaloClusters[clusterColl]) {
        const cluster = this.eventData.CaloClusters[clusterColl][clusterIndex];
        if (cluster) {
          this.addCluster(cluster, muonScene);
        }
      }
    }

    for (const trackID of muon.LinkedTracks) {
      const trackColl = trackID.split(':')[0];
      const trackIndex = trackID.split(':')[1];

      if (trackColl && trackIndex && this.eventData.Tracks && this.eventData.Tracks[trackColl]) {
        const track = this.eventData.Tracks[trackColl][trackIndex];
        if (track) {
          this.addTrack(track, muonScene);
        }
      }
    }
    // add to scene
    scene.add(muonScene);
  }

  getCollections(): string[] {
    if(!this.eventData) return null;

    const collections = [];
    for (const objectType of Object.keys(this.eventData)) {
      for (const collection of Object.keys(this.eventData[objectType])) {
        collections.push(collection);
      }
    }
    return collections;
  }

  getCollection(collectionName: string): any {
    if(!this.eventData) return null;

    for (const objectType of Object.keys(this.eventData)) {
      for (const collection of Object.keys(this.eventData[objectType])) {
        if (collection === collectionName) {
          return this.eventData[objectType][collection];
        }
      }
    }
  }

}
