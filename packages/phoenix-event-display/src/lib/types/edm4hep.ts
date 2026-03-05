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

  export type TrackerHit = Schema1.TrackerHit;

  export type TrackerHit3D =
    | Schema2.TrackerHit3D
    | Schema3.TrackerHit3D
    | Schema4.TrackerHit3D
    | Schema5.TrackerHit3D
    | Schema6.TrackerHit3D;

  export type TrackerHitPlane =
    | Schema2.TrackerHitPlane
    | Schema3.TrackerHitPlane
    | Schema4.TrackerHitPlane
    | Schema5.TrackerHitPlane
    | Schema6.TrackerHitPlane;

  export type SenseWireHit = Schema5.SenseWireHit | Schema6.SenseWireHit;

  export type SimTrackerHit =
    | Schema1.SimTrackerHit
    | Schema2.SimTrackerHit
    | Schema3.SimTrackerHit
    | Schema4.SimTrackerHit
    | Schema5.SimTrackerHit
    | Schema6.SimTrackerHit;

  export type CalorimeterHit =
    | Schema1.CalorimeterHit
    | Schema2.CalorimeterHit
    | Schema3.CalorimeterHit
    | Schema4.CalorimeterHit
    | Schema5.CalorimeterHit
    | Schema6.CalorimeterHit;

  export type SimCalorimeterHit =
    | Schema1.SimCalorimeterHit
    | Schema2.SimCalorimeterHit
    | Schema3.SimCalorimeterHit
    | Schema4.SimCalorimeterHit
    | Schema5.SimCalorimeterHit
    | Schema6.SimCalorimeterHit;

  export type Cluster =
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

  export type EventHeaderCollection =
    | Schema1.EventHeader[]
    | Schema2.EventHeader[]
    | Schema3.EventHeader[]
    | Schema4.EventHeader[]
    | Schema5.EventHeader[]
    | Schema6.EventHeader[];

  export type VertexCollection =
    | Schema1.Vertex[]
    | Schema2.Vertex[]
    | Schema3.Vertex[]
    | Schema4.Vertex[]
    | Schema5.Vertex[]
    | Schema6.Vertex[];

  export type TrackCollection =
    | Schema1.Track[]
    | Schema2.Track[]
    | Schema3.Track[]
    | Schema4.Track[]
    | Schema5.Track[]
    | Schema6.Track[];

  export type RecoMCParticleLink =
    | Schema1.MCRecoParticleAssociation[]
    | Schema2.RecoMCParticleLink[]
    | Schema3.RecoMCParticleLink[]
    | Schema4.RecoMCParticleLink[]
    | Schema5.RecoMCParticleLink[]
    | Schema6.RecoMCParticleLink[];

  export type TrackerHitCollection = Schema1.TrackerHit[];

  export type TrackerHit3DCollection =
    | Schema2.TrackerHit3D[]
    | Schema3.TrackerHit3D[]
    | Schema4.TrackerHit3D[]
    | Schema5.TrackerHit3D[]
    | Schema6.TrackerHit3D[];

  export type TrackerHitPlaneCollection =
    | Schema2.TrackerHitPlane[]
    | Schema3.TrackerHitPlane[]
    | Schema4.TrackerHitPlane[]
    | Schema5.TrackerHitPlane[]
    | Schema6.TrackerHitPlane[];

  export type SenseWireHitCollection =
    | Schema5.SenseWireHit[]
    | Schema6.SenseWireHit[];

  export type SimTrackerHitCollection =
    | Schema1.SimTrackerHit[]
    | Schema2.SimTrackerHit[]
    | Schema3.SimTrackerHit[]
    | Schema4.SimTrackerHit[]
    | Schema5.SimTrackerHit[]
    | Schema6.SimTrackerHit[];

  export type CalorimeterHitCollection =
    | Schema1.CalorimeterHit[]
    | Schema2.CalorimeterHit[]
    | Schema3.CalorimeterHit[]
    | Schema4.CalorimeterHit[]
    | Schema5.CalorimeterHit[]
    | Schema6.CalorimeterHit[];

  export type SimCalorimeterHitCollection =
    | Schema1.SimCalorimeterHit[]
    | Schema2.SimCalorimeterHit[]
    | Schema3.SimCalorimeterHit[]
    | Schema4.SimCalorimeterHit[]
    | Schema5.SimCalorimeterHit[]
    | Schema6.SimCalorimeterHit[];

  export type ClusterCollection =
    | Schema1.Cluster[]
    | Schema2.Cluster[]
    | Schema3.Cluster[]
    | Schema4.Cluster[]
    | Schema5.Cluster[]
    | Schema6.Cluster[];

  export type ReconstructedParticleCollection =
    | Schema1.ReconstructedParticle[]
    | Schema2.ReconstructedParticle[]
    | Schema3.ReconstructedParticle[]
    | Schema4.ReconstructedParticle[]
    | Schema5.ReconstructedParticle[]
    | Schema6.ReconstructedParticle[];

  export type RecoMCParticleLinkCollection =
    | Schema1.MCRecoParticleAssociationCollection[]
    | Schema2.RecoMCParticleLinkCollection[]
    | Schema3.RecoMCParticleLinkCollection[]
    | Schema4.RecoMCParticleLinkCollection[]
    | Schema5.RecoMCParticleLinkCollection[]
    | Schema6.RecoMCParticleLinkCollection[];

  export type Event = {
    [name: string]:
      | Schema1.Item
      | Schema2.Item
      | Schema3.Item
      | Schema4.Item
      | Schema5.Item
      | Schema6.Item;
  };
}
