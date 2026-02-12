/** Type definitions for Phoenix event data structures. */

/** Track helix params: [d0, z0, phi, theta, qOverP] */
export type DParams = [number, number, number, number, number];

/** Parameters for a single track. */
export interface TrackParams {
  /** Array of [x, y, z] positions defining the track path. */
  pos?: number[][];
  /** Helix parameters for Runge-Kutta extrapolation. */
  dparams?: DParams;
  /** Azimuthal angle. */
  phi?: number;
  /** Pseudorapidity. */
  eta?: number;
  /** Transverse impact parameter. */
  d0?: number;
  /** Longitudinal impact parameter. */
  z0?: number;
  /** Transverse momentum. */
  pT?: number;
  /** Chi-squared of the track fit. */
  chi2?: number;
  /** Degrees of freedom. */
  dof?: number;
  /** Color as hex string. */
  color?: string;
  /** Line width for rendering. */
  linewidth?: number;
  /** Whether the track was extrapolated. Set internally. */
  extended?: boolean;
  /** UUID assigned after object creation. Set internally. */
  uuid?: string;
  /** Track ID in merged mesh. Set internally. */
  tid?: number;
  /** Material reference. Set internally. */
  material?: unknown;
  /** Extra experiment-specific properties. */
  [key: string]: unknown;
}

/** Parameters for a single jet. */
export interface JetParams {
  /** Pseudorapidity. */
  eta: number;
  /** Azimuthal angle. */
  phi: number;
  /** Polar angle. Derived from eta if absent. */
  theta?: number;
  /** Jet energy. */
  energy?: number;
  /** Transverse energy — used if energy is absent. */
  et?: number;
  /** Cone radius for visualization width. */
  coneR?: number;
  /** Jet origin X displacement. */
  origin_X?: number;
  /** Jet origin Y displacement. */
  origin_Y?: number;
  /** Jet origin Z displacement. */
  origin_Z?: number;
  /** Color for rendering. */
  color?: string | number;
  /** UUID assigned after object creation. Set internally. */
  uuid?: string;
  /** Extra experiment-specific properties. */
  [key: string]: unknown;
}

/** Can be a simple [x,y,z] array or an object with pos + metadata. */
export interface HitParams {
  /** Position coordinates. */
  pos: number[];
  /** Drawing type: 'Point', 'CircularPoint', 'Line', or 'Box'. */
  type?: string;
  /** Color for rendering. */
  color?: string | number;
  /** Additional info attached to the hit. */
  extraInfo?: Record<string, unknown>;
  /** UUID assigned after object creation. Set internally. */
  uuid?: string;
  /** Extra experiment-specific properties. */
  [key: string]: unknown;
}

/** Parameters for a single calorimeter cluster. */
export interface CaloClusterParams {
  /** Cluster energy. */
  energy: number;
  /** Azimuthal angle. */
  phi: number;
  /** Pseudorapidity. */
  eta: number;
  /** Cylindrical radius override. */
  radius?: number;
  /** Z position override. */
  z?: number;
  /** Side width of the cluster box. */
  side?: number;
  /** Length (depth) of the cluster box. */
  length?: number;
  /** Color for rendering. */
  color?: string;
  /** Polar angle. Derived from eta if absent. */
  theta?: number;
  /** Opacity value. */
  opacity?: number;
  /** UUID assigned after object creation. Set internally. */
  uuid?: string;
  /** Extra experiment-specific properties. */
  [key: string]: unknown;
}

/** Parameters for a single calorimeter cell. */
export interface CaloCellParams {
  /** Cell energy. */
  energy: number;
  /** Azimuthal angle. */
  phi: number;
  /** Pseudorapidity. */
  eta: number;
  /** Cylindrical radius override. */
  radius?: number;
  /** Z position override. */
  z?: number;
  /** Polar angle. Derived from eta if absent. */
  theta?: number;
  /** Color for rendering. */
  color?: string;
  /** Opacity value. */
  opacity?: number;
  /** Side width of the cell box. */
  side?: number;
  /** Length (depth) of the cell box. */
  length?: number;
  /** UUID assigned after object creation. Set internally. */
  uuid: string;
  /** Extra experiment-specific properties. */
  [key: string]: unknown;
}

/** Parameters for a single planar calorimeter cell. */
export interface PlanarCaloCellParams {
  /** Cell energy. */
  energy: number;
  /** Position [x, y]. */
  pos?: number[];
  /** Cell size (width). */
  cellSize?: number;
  /** Plane definition [nx, ny, nz, d]. */
  plane?: number[];
  /** Color for rendering. */
  color?: string | number;
  /** UUID assigned after object creation. Set internally. */
  uuid?: string;
  /** Extra experiment-specific properties. */
  [key: string]: unknown;
}

/** Irregular cell defined by 8 arbitrary vertices (24 floats). */
export interface IrregularCaloCellParams {
  /** Drawing type identifier. */
  type?: string;
  /** Calorimeter layer. */
  layer: number;
  /** Flattened list of 8 vertex coordinates (24 floats). */
  vtx: number[];
  /** Color as [R, G, B] integer array or string. */
  color: string | number[];
  /** Opacity from 0 to 1. */
  opacity: number;
  /** Cell energy. */
  energy?: number;
  /** UUID assigned after object creation. Set internally. */
  uuid?: string;
  /** Extra experiment-specific properties. */
  [key: string]: unknown;
}

/** Parameters for a single vertex. */
export interface VertexParams {
  /** Position as [x, y, z]. */
  pos?: number[];
  /** X coordinate (alternative to pos). */
  x?: number;
  /** Y coordinate (alternative to pos). */
  y?: number;
  /** Z coordinate (alternative to pos). */
  z?: number;
  /** Sphere size. */
  size?: number;
  /** Vertex type for cuts. */
  vertexType?: number;
  /** Color for rendering. */
  color?: string | number;
  /** UUID assigned after object creation. Set internally. */
  uuid?: string;
  /** Extra experiment-specific properties. */
  [key: string]: unknown;
}

/** Parameters for missing transverse energy. */
export interface MissingEnergyParams {
  /** X component of missing ET. */
  etx: number;
  /** Y component of missing ET. */
  ety: number;
  /** Color for rendering. */
  color?: string | number;
  /** UUID assigned after object creation. Set internally. */
  uuid?: string;
  /** Extra experiment-specific properties. */
  [key: string]: unknown;
}

/** Compound objects (Muon, Electron, Photon) link tracks and clusters. */
export interface CompoundObjectParams {
  /** Linked track parameters. */
  LinkedTracks?: TrackParams[];
  /** Linked cluster parameters. */
  LinkedClusters?: CaloClusterParams[];
  /** Azimuthal angle. */
  phi?: number;
  /** Pseudorapidity. */
  eta?: number;
  /** Energy. */
  energy?: number;
  /** Transverse momentum. */
  pT?: number;
  /** Extra experiment-specific properties. */
  [key: string]: unknown;
}

/** Named collection of physics objects: { collectionName: objectArray }. */
export type ObjectCollection<T = Record<string, unknown>> = {
  [collectionName: string]: T[];
};

/** A single event in Phoenix format. */
export interface PhoenixEventData {
  /** Track collections. */
  Tracks?: ObjectCollection<TrackParams>;
  /** Jet collections. */
  Jets?: ObjectCollection<JetParams>;
  /** Hit collections. */
  Hits?: ObjectCollection<HitParams | number[]>;
  /** Calorimeter cluster collections. */
  CaloClusters?: ObjectCollection<CaloClusterParams>;
  /** Calorimeter cell collections. */
  CaloCells?: ObjectCollection<CaloCellParams>;
  /** Planar calorimeter cell collections. */
  PlanarCaloCells?: {
    [collectionName: string]: {
      /** Plane definition [nx, ny, nz, d]. */
      plane: number[];
      /** Array of planar calo cells. */
      cells: PlanarCaloCellParams[];
    };
  };
  /** Irregular calorimeter cell collections. */
  IrregularCaloCells?: ObjectCollection<IrregularCaloCellParams>;
  /** Muon collections. */
  Muons?: ObjectCollection<CompoundObjectParams>;
  /** Photon collections. */
  Photons?: ObjectCollection<CompoundObjectParams>;
  /** Electron collections. */
  Electrons?: ObjectCollection<CompoundObjectParams>;
  /** Vertex collections. */
  Vertices?: ObjectCollection<VertexParams>;
  /** Missing energy collections. */
  MissingEnergy?: ObjectCollection<MissingEnergyParams>;
  /** Event number. */
  'event number'?: string | number;
  /** Event number (alt key). */
  eventNumber?: string | number;
  /** Run number. */
  'run number'?: string | number;
  /** Run number (alt key). */
  runNumber?: string | number;
  /** Experiment-specific object types. */
  [key: string]: unknown;
}

/** Multiple events keyed by event name. */
export interface PhoenixEventsData {
  /** Individual event data. */
  [eventKey: string]: PhoenixEventData;
}
