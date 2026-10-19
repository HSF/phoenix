import type * as Schema1 from './edm4hep-schemas/schema1';
import type * as Schema2 from './edm4hep-schemas/schema2';
import type * as Schema3 from './edm4hep-schemas/schema3';
import type * as Schema4 from './edm4hep-schemas/schema4';
import type * as Schema5 from './edm4hep-schemas/schema5';
import type * as Schema6 from './edm4hep-schemas/schema6';
import type * as Schema7 from './edm4hep-schemas/schema7';

/** Every supported schema version (new versions only need to be added here) */
type Schemas =
  | Schema1.Types
  | Schema2.Types
  | Schema3.Types
  | Schema4.Types
  | Schema5.Types
  | Schema6.Types
  | Schema7.Types;

export type Vertex = Schemas['Vertex'];

export type TrackState = Schemas['TrackState'];

export type Track = Schemas['Track'] & {
  // MUTATED PROPERTIES
  pid: string;
};

export type Hit = Schemas['Hit'];

export type CaloCell = Schemas['CaloCell'];

export type CaloCluster = Schemas['CaloCluster'];

export type ReconstructedParticle = Schemas['ReconstructedParticle'];

export type EventHeader = Schemas['EventHeader'];

export type MCParticle = Schemas['MCParticle'];

export type Association = Schema1.MCRecoParticleAssociation;

export type Link = Schemas['Link'];

export type Item = Schemas['Coll'];

export type Event = { [name: string]: Schemas['Coll'] };

export enum ParticleType {
  Electron = 'electron',
  Muon = 'muon',
  Photon = 'photon',
  Pion = 'pion',
  Proton = 'proton',
  Kaon = 'kaon',
  Other = 'other',
}
