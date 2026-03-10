import { Schema1 } from './edm4hep-schemas/schema1';
import { Schema2 } from './edm4hep-schemas/schema2';
import { Schema3 } from './edm4hep-schemas/schema3';
import { Schema4 } from './edm4hep-schemas/schema4';
import { Schema5 } from './edm4hep-schemas/schema5';
import { Schema6 } from './edm4hep-schemas/schema6';

export namespace edm4hep {
  export type Vertex =
    | Schema1.Vertex
    | Schema2.Vertex
    | Schema3.Vertex
    | Schema4.Vertex
    | Schema5.Vertex
    | Schema6.Vertex;

  export type TrackState =
    | Schema1.TrackState
    | Schema2.TrackState
    | Schema3.TrackState
    | Schema4.TrackState
    | Schema5.TrackState
    | Schema6.TrackState;

  export type Track = (
    | Schema1.Track
    | Schema2.Track
    | Schema3.Track
    | Schema4.Track
    | Schema5.Track
    | Schema6.Track
  ) & {
    // MUTATED PROPERTIES
    color: string;
    pid: string;
    pdgid: number;
  };

  export type Hit =
    | Schema1.TrackerHit
    | Schema1.SimTrackerHit
    | Schema2.TrackerHit3D
    | Schema2.TrackerHitPlane
    | Schema2.SimTrackerHit
    | Schema3.TrackerHit3D
    | Schema3.TrackerHitPlane
    | Schema3.SimTrackerHit
    | Schema4.TrackerHit3D
    | Schema4.TrackerHitPlane
    | Schema4.SimTrackerHit
    | Schema5.TrackerHit3D
    | Schema5.TrackerHitPlane
    | Schema5.SenseWireHit
    | Schema5.SimTrackerHit
    | Schema6.TrackerHit3D
    | Schema6.TrackerHitPlane
    | Schema6.SenseWireHit
    | Schema6.SimTrackerHit;

  export type CaloCell =
    | Schema1.CalorimeterHit
    | Schema1.SimCalorimeterHit
    | Schema2.CalorimeterHit
    | Schema2.SimCalorimeterHit
    | Schema3.CalorimeterHit
    | Schema3.SimCalorimeterHit
    | Schema4.CalorimeterHit
    | Schema4.SimCalorimeterHit
    | Schema5.CalorimeterHit
    | Schema5.SimCalorimeterHit
    | Schema6.CalorimeterHit
    | Schema6.SimCalorimeterHit;

  export type CaloCluster =
    | Schema1.Cluster
    | Schema2.Cluster
    | Schema3.Cluster
    | Schema4.Cluster
    | Schema5.Cluster
    | Schema6.Cluster;

  export type ReconstructedParticle =
    | Schema1.ReconstructedParticle
    | Schema2.ReconstructedParticle
    | Schema3.ReconstructedParticle
    | Schema4.ReconstructedParticle
    | Schema5.ReconstructedParticle
    | Schema6.ReconstructedParticle;

  export type EventHeader =
    | Schema1.EventHeader
    | Schema2.EventHeader
    | Schema3.EventHeader
    | Schema4.EventHeader
    | Schema5.EventHeader
    | Schema6.EventHeader;

  export type MCParticle =
    | Schema1.MCParticle
    | Schema2.MCParticle
    | Schema3.MCParticle
    | Schema4.MCParticle
    | Schema5.MCParticle
    | Schema6.MCParticle;

  export type Association = Schema1.MCRecoParticleAssociation;

  export type Link =
    | Schema2.RecoMCParticleLink
    | Schema3.RecoMCParticleLink
    | Schema4.RecoMCParticleLink
    | Schema5.RecoMCParticleLink
    | Schema6.RecoMCParticleLink;

  export type Item =
    | Schema1.Coll
    | Schema2.Coll
    | Schema3.Coll
    | Schema4.Coll
    | Schema5.Coll
    | Schema6.Coll;

  export type Event = {
    [name: string]:
      | Schema1.Coll
      | Schema2.Coll
      | Schema3.Coll
      | Schema4.Coll
      | Schema5.Coll
      | Schema6.Coll;
  };
}
