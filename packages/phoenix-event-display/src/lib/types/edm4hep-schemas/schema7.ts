import type * as Schema6 from './schema6';

// Types unchanged since the previous schema are linked, and purely additive changes extend them.
// Anything else that changed is reassigned. For example, Coll always refers to the types of its own schema.

/** Vertex */
export type Vertex = Schema6.Vertex;

/** Parametrized description of a particle track */
export type TrackState = Schema6.TrackState;

/** Reconstructed track */
export type Track = Schema6.Track;

/** Tracker hit */
export interface TrackerHit3D extends Schema6.TrackerHit3D {
  timeError: number; // [ns] error measured on time
}

/** Tracker hit plane */
export interface TrackerHitPlane extends Schema6.TrackerHitPlane {
  timeError: number; // [ns] error measured on time
}

/** Sense wire hit, knowing only the distance to the wire. The circle representing possible positions is parametrized with its center, radius and normal vector (given by the wire direction). */
export interface SenseWireHit extends Schema6.SenseWireHit {
  timeError: number; // [ns] error measured on time
}

/** Simulated tracker hit */
export type SimTrackerHit = Schema6.SimTrackerHit;

/** Calorimeter hit */
export type CalorimeterHit = Schema6.CalorimeterHit;

/** Simulated calorimeter hit */
export type SimCalorimeterHit = Schema6.SimCalorimeterHit;

/** Calorimeter Hit Cluster */
export type Cluster = Schema6.Cluster;

/** Reconstructed Particle */
export type ReconstructedParticle = Schema6.ReconstructedParticle;

/** Event Header. Additional parameters are assumed to go into the metadata tree. */
export type EventHeader = Schema6.EventHeader;

/** Link between a ReconstructedParticle and an MCParticle */
export type RecoMCParticleLink = Schema6.RecoMCParticleLink;

/** The Monte Carlo particle - based on the lcio::MCParticle. */
export type MCParticle = Schema6.MCParticle;

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
      collType: 'edm4hep::SenseWireHitCollection';
      collection: SenseWireHit[];
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
  Hit: TrackerHit3D | TrackerHitPlane | SenseWireHit | SimTrackerHit;
  CaloCell: CalorimeterHit | SimCalorimeterHit;
  CaloCluster: Cluster;
  ReconstructedParticle: ReconstructedParticle;
  EventHeader: EventHeader;
  MCParticle: MCParticle;
  Link: RecoMCParticleLink;
  Coll: Coll;
}
