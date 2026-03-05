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

  export type EventHeaderCollection =
    | Schema1.EventHeaderCollection
    | Schema2.EventHeaderCollection
    | Schema3.EventHeaderCollection
    | Schema4.EventHeaderCollection
    | Schema5.EventHeaderCollection
    | Schema6.EventHeaderCollection;

  export type VertexCollection =
    | Schema1.VertexCollection
    | Schema2.VertexCollection
    | Schema3.VertexCollection
    | Schema4.VertexCollection
    | Schema5.VertexCollection
    | Schema6.VertexCollection;

  export type TrackCollection =
    | Schema1.TrackCollection
    | Schema2.TrackCollection
    | Schema3.TrackCollection
    | Schema4.TrackCollection
    | Schema5.TrackCollection
    | Schema6.TrackCollection;

  export type MCRecoParticleAssociation =
    Schema1.MCRecoParticleAssociationCollection;

  export type RecoMCParticleLink =
    | Schema2.RecoMCParticleLinkCollection
    | Schema3.RecoMCParticleLinkCollection
    | Schema4.RecoMCParticleLinkCollection
    | Schema5.RecoMCParticleLinkCollection
    | Schema6.RecoMCParticleLinkCollection;

  export type TrackerHitCollection = Schema1.TrackerHitCollection;

  export type TrackerHit3DCollection =
    | Schema2.TrackerHit3DCollection
    | Schema3.TrackerHit3DCollection
    | Schema4.TrackerHit3DCollection
    | Schema5.TrackerHit3DCollection
    | Schema6.TrackerHit3DCollection;

  export type TrackerHitPlaneCollection =
    | Schema2.TrackerHitPlaneCollection
    | Schema3.TrackerHitPlaneCollection
    | Schema4.TrackerHitPlaneCollection
    | Schema5.TrackerHitPlaneCollection
    | Schema6.TrackerHitPlaneCollection;

  export type SenseWireHitCollection =
    | Schema5.SenseWireHitCollection
    | Schema6.SenseWireHitCollection;

  export type SimTrackerHitCollection =
    | Schema1.SimTrackerHitCollection
    | Schema2.SimTrackerHitCollection
    | Schema3.SimTrackerHitCollection
    | Schema4.SimTrackerHitCollection
    | Schema5.SimTrackerHitCollection
    | Schema6.SimTrackerHitCollection;

  export type CalorimeterHitCollection =
    | Schema1.CalorimeterHitCollection
    | Schema2.CalorimeterHitCollection
    | Schema3.CalorimeterHitCollection
    | Schema4.CalorimeterHitCollection
    | Schema5.CalorimeterHitCollection
    | Schema6.CalorimeterHitCollection;

  export type SimCalorimeterHitCollection =
    | Schema1.SimCalorimeterHitCollection
    | Schema2.SimCalorimeterHitCollection
    | Schema3.SimCalorimeterHitCollection
    | Schema4.SimCalorimeterHitCollection
    | Schema5.SimCalorimeterHitCollection
    | Schema6.SimCalorimeterHitCollection;

  export type ClusterCollection =
    | Schema1.ClusterCollection
    | Schema2.ClusterCollection
    | Schema3.ClusterCollection
    | Schema4.ClusterCollection
    | Schema5.ClusterCollection
    | Schema6.ClusterCollection;

  export type ReconstructedParticleCollection =
    | Schema1.ReconstructedParticleCollection
    | Schema2.ReconstructedParticleCollection
    | Schema3.ReconstructedParticleCollection
    | Schema4.ReconstructedParticleCollection
    | Schema5.ReconstructedParticleCollection
    | Schema6.ReconstructedParticleCollection;

  export type MCParticleCollection =
    | Schema1.MCParticleCollection
    | Schema2.MCParticleCollection
    | Schema3.MCParticleCollection
    | Schema4.MCParticleCollection
    | Schema5.MCParticleCollection
    | Schema6.MCParticleCollection;

  export type AssociationCollection =
    Schema1.MCRecoParticleAssociationCollection;

  export type LinkCollection =
    | Schema2.RecoMCParticleLinkCollection
    | Schema3.RecoMCParticleLinkCollection
    | Schema4.RecoMCParticleLinkCollection
    | Schema5.RecoMCParticleLinkCollection
    | Schema6.RecoMCParticleLinkCollection;

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
