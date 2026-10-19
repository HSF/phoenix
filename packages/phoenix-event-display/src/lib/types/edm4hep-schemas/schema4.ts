/* eslint-disable @typescript-eslint/no-namespace */
import { Vector3d, ObjectID } from './utils';
import { Schema3 } from './schema3';

// Types unchanged since the previous schema are linked, and purely additive changes extend them.
// Anything else that changed is reassigned. For example, Coll always refers to the types of its own schema.

export namespace Schema4 {
  /** Vertex */
  export type Vertex = Schema3.Vertex;

  /** Parametrized description of a particle track */
  export type TrackState = Schema3.TrackState;

  /** Reconstructed track */
  export type Track = Schema3.Track;

  /** Tracker hit */
  export type TrackerHit3D = Schema3.TrackerHit3D;

  /** Tracker hit plane */
  export type TrackerHitPlane = Schema3.TrackerHitPlane;

  /** Simulated tracker hit */
  export type SimTrackerHit = Schema3.SimTrackerHit;

  /** Calorimeter hit */
  export type CalorimeterHit = Schema3.CalorimeterHit;

  /** Simulated calorimeter hit */
  export type SimCalorimeterHit = Schema3.SimCalorimeterHit;

  /** Calorimeter Hit Cluster */
  export type Cluster = Schema3.Cluster;

  /** Reconstructed Particle */
  export type ReconstructedParticle = Schema3.ReconstructedParticle;

  /** Event Header. Additional parameters are assumed to go into the metadata tree. */
  export type EventHeader = Schema3.EventHeader;

  /** Link between a ReconstructedParticle and an MCParticle */
  export type RecoMCParticleLink = Schema3.RecoMCParticleLink;

  /** The Monte Carlo particle - based on the lcio::MCParticle. */
  // Not derived from Schema3.MCParticle: spin was replaced by helicity.
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
    helicity: number; // particle helicity (9 if unset)
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
}
