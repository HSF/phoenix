import { Vector3f, Vector3d, ObjectID } from './utils';
import type * as Schema2 from './schema2';

// Types unchanged since the previous schema are linked, and purely additive changes extend them.
// Anything else that changed is reassigned. For example, Coll always refers to the types of its own schema.

/** Vertex */
export type Vertex = Schema2.Vertex;

/** Parametrized description of a particle track */
export type TrackState = Schema2.TrackState;

/** Reconstructed track */
export type Track = Schema2.Track;

/** Tracker hit */
export type TrackerHit3D = Schema2.TrackerHit3D;

/** Tracker hit plane */
export type TrackerHitPlane = Schema2.TrackerHitPlane;

/** Simulated tracker hit */
export type SimTrackerHit = Schema2.SimTrackerHit;

/** Calorimeter hit */
export type CalorimeterHit = Schema2.CalorimeterHit;

/** Simulated calorimeter hit */
export type SimCalorimeterHit = Schema2.SimCalorimeterHit;

/** Calorimeter Hit Cluster */
export type Cluster = Schema2.Cluster;

/** Reconstructed Particle */
export type ReconstructedParticle = Schema2.ReconstructedParticle;

/** Event Header. Additional parameters are assumed to go into the metadata tree. */
// Not derived from Schema2.EventHeader: eventNumber changed from number to bigint.
export type EventHeader = {
  eventNumber: bigint; // event number
  runNumber: number; // run number
  timeStamp: bigint; // time stamp
  weight: number; // event weight
  weights: number[]; // event weights in case there are multiple. **NOTE that weights[0] might not be the same as weight!** Event weight names should be stored using the edm4hep::EventWeights name in the file level metadata
};

/** Link between a ReconstructedParticle and an MCParticle */
export type RecoMCParticleLink = Schema2.RecoMCParticleLink;

/** The Monte Carlo particle - based on the lcio::MCParticle. */
// Not derived from Schema2.MCParticle: colorFlow was removed.
export type MCParticle = {
  PDG: number; // PDG code of the particle
  generatorStatus: number; // status of the particle as defined by the generator
  simulatorStatus: number; // status of the particle from the simulation program - use BIT constants below
  charge: number; // [e] particle charge
  time: number; // [ns] creation time of the particle in wrt. the event, e.g. for preassigned decays or decays in flight from the simulator
  mass: number; // [GeV] mass of the particle
  vertex: Vector3d; // [mm] production vertex of the particle
  endpoint: Vector3d; // [mm] endpoint of the particle
  momentum: Vector3d; // [GeV] particle 3-momentum at the production vertex
  momentumAtEndpoint: Vector3d; // [GeV] particle 3-momentum at the endpoint
  spin: Vector3f; // spin (helicity) vector of the particle
  parents: ObjectID[]; // The parents of this particle
  daughters: ObjectID[]; // The daughters this particle
};

export type Coll =
  | {
      collID: number;
      collSchemaVersion: number;
      collType: 'edm4hep::EventHeaderCollection';
      collection: EventHeader[];
    }
  | {
      collID: number;
      collSchemaVersion: number;
      collType: 'edm4hep::VertexCollection';
      collection: Vertex[];
    }
  | {
      collID: number;
      collSchemaVersion: number;
      collType: 'edm4hep::TrackCollection';
      collection: Track[];
    }
  | {
      collID: number;
      collSchemaVersion: number;
      collType: 'edm4hep::TrackerHit3DCollection';
      collection: TrackerHit3D[];
    }
  | {
      collID: number;
      collSchemaVersion: number;
      collType: 'edm4hep::TrackerHitPlaneCollection';
      collection: TrackerHitPlane[];
    }
  | {
      collID: number;
      collSchemaVersion: number;
      collType: 'edm4hep::SimTrackerHitCollection';
      collection: SimTrackerHit[];
    }
  | {
      collID: number;
      collSchemaVersion: number;
      collType: 'edm4hep::CalorimeterHitCollection';
      collection: CalorimeterHit[];
    }
  | {
      collID: number;
      collSchemaVersion: number;
      collType: 'edm4hep::SimCalorimeterHitCollection';
      collection: SimCalorimeterHit[];
    }
  | {
      collID: number;
      collSchemaVersion: number;
      collType: 'edm4hep::ClusterCollection';
      collection: Cluster[];
    }
  | {
      collID: number;
      collSchemaVersion: number;
      collType: 'edm4hep::ReconstructedParticleCollection';
      collection: ReconstructedParticle[];
    }
  | {
      collID: number;
      collSchemaVersion: number;
      collType: 'podio::LinkCollection<edm4hep::ReconstructedParticle,edm4hep::MCParticle>';
      collection: RecoMCParticleLink[];
    };

export interface Types {
  Vertex: Vertex;
  TrackState: TrackState;
  Track: Track;
  Hit: TrackerHit3D | TrackerHitPlane | SimTrackerHit;
  CaloCell: CalorimeterHit | SimCalorimeterHit;
  CaloCluster: Cluster;
  ReconstructedParticle: ReconstructedParticle;
  EventHeader: EventHeader;
  MCParticle: MCParticle;
  Link: RecoMCParticleLink;
  Coll: Coll;
}
