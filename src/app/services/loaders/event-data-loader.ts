import {Scene} from 'three';

export interface EventDataLoader {
  addTrack(track: any, scene: Scene);

  addJet(jet: any, scene: Scene);

  addHits(hits: any, scene: Scene);
}
