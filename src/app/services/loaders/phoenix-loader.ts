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

  public buildEventData(eventData: any, graphicsLibrary: ThreeService, ui: UIService): void {
    this.graphicsLibrary = graphicsLibrary;
    this.ui = ui;
    this.eventData = eventData;
    // Creating UI folder
    this.ui.addEventDataFolder();
    // Clearing existing event data
    this.graphicsLibrary.clearEventData();
    this.loadObjectTypes(eventData);
  }

  private loadObjectTypes(eventData: any) {
    if (eventData.Tracks) {
      const cuts = [
        new Cut('chi2', 0, 50),
        new Cut('dof', 0, 100)];
      this.addEventCollections(eventData.Tracks, this.addTrack, 'Tracks', cuts);
    }
    if (eventData.Jets) {
      const cuts = [
        new Cut('phi', -Math.PI, Math.PI),
        new Cut('eta', 0, 100),
        new Cut('energy', 2000, 10000)];
      this.addEventCollections(eventData.Jets, this.addJet, 'Jets', cuts);
    }
    if (eventData.Hits) {
      this.addEventCollections(eventData.Hits, this.addHits, 'Hits');
    }
    if (eventData.CaloClusters) {
      const cuts = [
        new Cut('phi', -Math.PI, Math.PI),
        new Cut('eta', 0, 100),
        new Cut('energy', 2000, 10000)];
      this.addEventCollections(eventData.CaloClusters, this.addCluster, 'CaloClusters', cuts);
    }
    if (eventData.Muons) {
      this.addEventCollections(eventData.Muons, this.addMuon, 'Muons');
    }
  }

  private addEventCollections(collections: any, addObject: any, objectType: string, cuts?: Cut[]) {
    const typeFolder = this.ui.addEventDataTypeFolder(objectType);
    const typeGroup = this.graphicsLibrary.addEventDataTypeGroup(objectType);
    for (const collname of Object.keys(collections)) {
      const collection = collections[collname];
      if (collection != null) {
        this.addCollection(collection, collname, addObject, typeGroup);
        this.ui.addCollection(typeFolder, collname, cuts);
      }
    }
  }

  private addCollection(collection: any, collname: string, addObject: (object: any, scene: any) => void, typeGroup: Group) {
    const collscene = new THREE.Group();
    collscene.name = collname;
    for (const object of collection) {
      addObject.bind(this)(object, collscene);
    }
    typeGroup.add(collscene);
  }

  protected addTrack(track: any, scene: Object3D): Object3D {
    // Track with no points
    if (!track.pos) {
      return;
    }

    const length = 100;
    let colour = 0xff0000;
    if (track.color) {
      colour = parseInt(track.color, 16);
    }

    const positions = track.pos;
    const numPoints = positions.length;
    if (numPoints < 3) {
      // Track with too few points
      return;
    }
    // Now sort these.
    positions.sort((a, b) => {
      const distA = a[0] * a[0] + a[1] * a[1] + a[2] * a[2];
      const distB = b[0] * b[0] + b[1] * b[1] + b[2] * b[2];
      if (distA < distB) {
        return -1;
      }
      if (distA > distB) {
        return -1;
      }
      return 0;
    });

    // Apply pT cut TODO - make this configurable.
    if (track.hasOwnProperty('mom')) {
      const mom = track.mom;
      if (mom[0] * mom[0] + mom[1] * mom[1] + mom[2] * mom[2] < 0.25) {
        // console.log('Track mom<0.5 GeV. Skipping. Positions are: ' + positions + ' particle_id: ' + track.particle_id);
        return;
      }
    }

    const points = [];

    for (let i = 0; i < numPoints; i++) {
      points.push(new THREE.Vector3(positions[i][0], positions[i][1], positions[i][2]));
    }

    const curve = new THREE.CatmullRomCurve3(points);
    const vertices = curve.getPoints(50);
    const geometry = new THREE.BufferGeometry().setFromPoints(vertices);
    const material = new THREE.LineBasicMaterial({color: colour});
    material.linewidth = 2;
    const splineObject = new THREE.Line(geometry, material);
    splineObject.userData = track;
    splineObject.name = 'Track';
    scene.add(splineObject);
    return splineObject;
  }

  protected addJet(jet: any, scene: Object3D): Object3D {
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
    return mesh;
  }

  protected addHits(hits: any, scene: Object3D): Object3D {
    const pointPos = new Float32Array(hits.length * 3);
    let i = 0;
    for (const hit of hits) {
      pointPos[i] = hit[0];
      pointPos[i + 1] = hit[1];
      pointPos[i + 2] = hit[2];
      i += 3;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.addAttribute('position', new THREE.BufferAttribute(pointPos, 3));
    geometry.computeBoundingSphere();
    const material = new THREE.PointsMaterial({size: 10});
    material.color.set('#ff0000');
    const pointsObj = new THREE.Points(geometry, material);
    pointsObj.userData = hits;
    pointsObj.name = 'Hit';
    scene.add(pointsObj);
    return pointsObj;
  }

  protected addCluster(cluster: any, scene: Object3D): Object3D {
    const maxR = 1100.0;
    const maxZ = 3200.0;
    const length = cluster.energy * 0.003;
    const geometry = new THREE.BoxGeometry(30, 30, length);
    const material = new THREE.MeshPhongMaterial({color: Math.random() * 0xffffff});
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
    scene.add(cube);
    return cube;
  }

  protected addMuon(muon: any, scene: Scene) {
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
    scene.add(muonScene);
  }

  getCollections(): string[] {
    const collections = [];
    for (const objectType of Object.keys(this.eventData)) {
      for (const collection of Object.keys(this.eventData[objectType])) {
        collections.push(collection);
      }
    }
    return collections;
  }

  getCollection(collectionName: string): any {
    for (const objectType of Object.keys(this.eventData)) {
      for (const collection of Object.keys(this.eventData[objectType])) {
        if (collection === collectionName) {
          return this.eventData[objectType][collection];
        }
      }
    }
  }

}
