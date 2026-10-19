import { Vector3d } from './utils';
import type * as Schema4 from './schema4';

// Types unchanged since the previous schema are linked, and purely additive changes extend them.
// Anything else that changed is reassigned. For example, Coll always refers to the types of its own schema.

/** Vertex */
export type Vertex = Schema4.Vertex;

/** Parametrized description of a particle track */
export type TrackState = Schema4.TrackState;

/** Reconstructed track */
export type Track = Schema4.Track;

/** Tracker hit interface class */
// Types: TrackerHit3D, TrackerHitPlane, SenseWireHit
interface TrackerHit {
  cellID: bigint; // ID of the sensor that created this hit
  type: number; // type of the raw data hit
  quality: number; // quality bit flag of the hit
  time: number; // [ns] time of the hit
  eDep: number; // [GeV] energy deposited on the hit
  eDepError: number; // [GeV] error measured on eDep
  position: Vector3d; // [mm] hit position as recorded by the sensor. The exact interpretation will depend on the currently held type of the interface
}

/** Tracker hit */
export type TrackerHit3D = Schema4.TrackerHit3D;

/** Tracker hit plane */
export type TrackerHitPlane = Schema4.TrackerHitPlane;

/** Sense wire hit, knowing only the distance to the wire. The circle representing possible positions is parametrized with its center, radius and normal vector (given by the wire direction). */
export interface SenseWireHit extends TrackerHit {
  cellID: bigint; // ID of the sensor that created this hit
  type: number; // type of the raw data hit
  quality: number; // quality bit flag of the hit
  time: number; // [ns] time of the hit
  eDep: number; // [GeV] energy deposited by the hit
  eDepError: number; // [GeV] error on eDep
  wireStereoAngle: number; // angle between the sense wire axis and the drift chamber axis (usually the z-axis) - use it together with wireAzimuthalAngle to get the wire direction
  wireAzimuthalAngle: number; // azimuthal angle at the middle of the sense wire - use it together with wireStereoAngle to get the wire direction
  position: Vector3d; // [mm] point on the sense wire which is closest to the hit (center of the circle)
  positionAlongWireError: number; // [mm] error on the hit position along the wire direction
  distanceToWire: number; // [mm] distance between the hit and the wire (radius of the circle)
  distanceToWireError: number; // [mm] error on distanceToWire
  nElectrons: number[]; // number of electrons for each cluster (number of clusters = vector size)
}

/** Simulated tracker hit */
export type SimTrackerHit = Schema4.SimTrackerHit;

/** Calorimeter hit */
export type CalorimeterHit = Schema4.CalorimeterHit;

/** Simulated calorimeter hit */
export type SimCalorimeterHit = Schema4.SimCalorimeterHit;

/** Calorimeter Hit Cluster */
export type Cluster = Schema4.Cluster;

/** Reconstructed Particle */
export type ReconstructedParticle = Schema4.ReconstructedParticle;

/** Event Header. Additional parameters are assumed to go into the metadata tree. */
export type EventHeader = Schema4.EventHeader;

/** Link between a ReconstructedParticle and an MCParticle */
export type RecoMCParticleLink = Schema4.RecoMCParticleLink;

/** The Monte Carlo particle - based on the lcio::MCParticle. */
export type MCParticle = Schema4.MCParticle;

export type EventHeaderCollection = EventHeader[];
export type VertexCollection = Vertex[];
export type TrackCollection = Track[];
export type TrackerHit3DCollection = TrackerHit3D[];
export type TrackerHitPlaneCollection = TrackerHitPlane[];
export type SenseWireHitCollection = SenseWireHit[];
export type SimTrackerHitCollection = SimTrackerHit[];
export type CalorimeterHitCollection = CalorimeterHit[];
export type SimCalorimeterHitCollection = SimCalorimeterHit[];
export type ClusterCollection = Cluster[];
export type ReconstructedParticleCollection = ReconstructedParticle[];
export type RecoMCParticleLinkCollection = RecoMCParticleLink[];
export type MCParticleCollection = MCParticle[];

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
