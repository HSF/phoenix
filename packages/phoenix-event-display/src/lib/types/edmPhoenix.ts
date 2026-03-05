import { Vector3d } from './edm4hep-schemas/utils';

export namespace edmPhoenix {
  export type Vertex = {
    color?: string;
    x: number;
    y: number;
    z: number;
  };

  export type Track = {
    pos: Vector3d;
    color?: string;
    d0?: number;
    z0?: number;
    phi?: number;
    eta?: number;
    qOverP?: number;
  };

  type Hit = {
    type?: 'Point';
    pos: Vector3d;
    color?: string;
  };

  type CaloCell = {
    energy: number;
    phi: number;
    eta: number;
  };

  type CaloCluster = {
    energy: number;
    phi: number;
    eta: number;
  };

  type Jet = {
    eta: number;
    phi: number;
    theta?: number;
    energy?: number;
    et?: number;
    coneR: number;
    color?: string;
  };

  type MissingEnegy = {
    etx: number;
    ety: number;
    color?: string;
  };

  export type Event = {
    'event number'?: number;
    'run number'?: number;
    Vertices?: {
      [name: string]: Vertex[];
    };
    Tracks?: {
      [name: string]: Track[];
    };
    Hits?: {
      [name: string]: Hit[];
    };
    CaloCells?: {
      [name: string]: CaloCell[];
    };
    CaloClusters?: {
      [name: string]: CaloCluster[];
    };
    Jets?: {
      [name: string]: Jet[];
    };
    MissingEnergy?: {
      [name: string]: MissingEnegy[];
    };
  };
}
