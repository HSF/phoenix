/* eslint-disable @typescript-eslint/no-namespace */
import { CovMatrix3f, Vector3f, ObjectID } from './utils';
import { Schema5 } from './schema5';

// Types unchanged since the previous schema are linked, and purely additive changes extend them.
// Anything else that changed is reassigned. For example, Coll always refers to the types of its own schema.

export namespace Schema6 {
  /** Vertex */
  export type Vertex = Schema5.Vertex;

  /** Parametrized description of a particle track */
  export type TrackState = Schema5.TrackState;

  /** Reconstructed track */
  export type Track = Schema5.Track;

  /** Tracker hit */
  export type TrackerHit3D = Schema5.TrackerHit3D;

  /** Tracker hit plane */
  export type TrackerHitPlane = Schema5.TrackerHitPlane;

  /** Sense wire hit, knowing only the distance to the wire. The circle representing possible positions is parametrized with its center, radius and normal vector (given by the wire direction). */
  export type SenseWireHit = Schema5.SenseWireHit;

  /** Simulated tracker hit */
  export type SimTrackerHit = Schema5.SimTrackerHit;

  /** Calorimeter hit */
  export type CalorimeterHit = Schema5.CalorimeterHit;

  /** Simulated calorimeter hit */
  export type SimCalorimeterHit = Schema5.SimCalorimeterHit;

  /** Calorimeter Hit Cluster */
  // Not derived from Schema5.Cluster: phi was renamed to iPhi.
  export type Cluster = {
    type: number; // flagword that defines the type of cluster
    energy: number; // [GeV] energy of the cluster
    energyError: number; // [GeV] error on the energy
    position: Vector3f; // [mm] position of the cluster
    positionError: CovMatrix3f; // [mm^2] covariance matrix of the position
    iTheta: number; // [rad] Polar angle of the cluster's intrinsic direction (used e.g. for vertexing). Not to be confused with the cluster position seen from IP
    iPhi: number; // [rad] Azimuthal angle of the cluster's intrinsic direction (used e.g. for vertexing). Not to be confused with the cluster position seen from IP
    directionError: Vector3f; // [mm^2] covariance matrix of the direction
    shapeParameters: number[]; // shape parameters. The corresponding names of the shape parameters should be stored in the collection named by edm4hep::labels::ShapeParameterNames in the file-level metadata, as a vector of strings in the same order as the parameters.
    subdetectorEnergies: number[]; // energy observed in a particular subdetector
    clusters: ObjectID[]; // clusters that have been combined to this cluster
    hits: ObjectID[]; // hits that have been combined to this cluster
  };

  /** Reconstructed Particle */
  export type ReconstructedParticle = Schema5.ReconstructedParticle;

  /** Event Header. Additional parameters are assumed to go into the metadata tree. */
  export type EventHeader = Schema5.EventHeader;

  /** Link between a ReconstructedParticle and an MCParticle */
  export type RecoMCParticleLink = Schema5.RecoMCParticleLink;

  /** The Monte Carlo particle - based on the lcio::MCParticle. */
  export type MCParticle = Schema5.MCParticle;

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
}
