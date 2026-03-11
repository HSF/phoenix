/* eslint-disable @typescript-eslint/no-namespace */
export namespace edmPhoenix {
  export type Position = [number, number, number];

  export type Vertex = {
    pos: Position;
    color?: string;
  };

  export type Track = {
    pos: Position;
    color?: string;
    d0?: number;
    z0?: number;
    phi?: number;
    eta?: number;
    qOverP?: number;
  };

  export type Hit = {
    pos: Position;
    type?: 'Point';
    color?: string;
  };

  export type CaloCell = {
    energy: number;
    phi: number;
    eta: number;
  };

  export type CaloCluster = {
    energy: number;
    phi: number;
    eta: number;
  };

  export type Jet = {
    eta: number;
    phi: number;
    theta?: number;
    energy?: number;
    et?: number;
    coneR?: number;
    color?: string;
  };

  export type MissingEnergy = {
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
      [name: string]: MissingEnergy[];
    };
  };
}
