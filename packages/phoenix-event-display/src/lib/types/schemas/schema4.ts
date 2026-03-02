import {
  CovMatrix3f,
  CovMatrix4f,
  CovMatrix6f,
  Vector2f,
  Vector3f,
  Vector3d,
  ObjectID,
} from './utils';

export namespace Schema4 {
  /** Parametrized description of a particle track */
  interface TrackState {
    location: number; // for use with At{Other|IP|FirstHit|LastHit|Calorimeter|Vertex}|LastLocation
    D0: number; // transverse impact parameter
    phi: number; // [rad] azimuthal angle of the track at this location (i.e. not phi0)
    omega: number; // [1/mm] is the signed curvature of the track
    Z0: number; // longitudinal impact parameter
    tanLambda: number; // lambda is the dip angle of the track in r-z
    time: number; // [ns] time of the track at this trackstate
    referencePoint: Vector3f; // [mm] Reference point of the track parameters, e.g. the origin at the IP, or the position  of the first/last hits or the entry point into the calorimeter
    covMatrix: CovMatrix6f; // covariance matrix of the track parameters.
  }

  /** Vertex */
  interface Vertex {
    type: number; // flagword that defines the type of the vertex, see reserved bits for more information
    chi2: number; // chi-squared of the vertex fit
    ndf: number; // number of degrees of freedom of the vertex fit
    position: Vector3f; // [mm]  position of the vertex
    covMatrix: CovMatrix3f; // [mm^2] covariance matrix of the position
    algorithmType: number; // type code for the algorithm that has been used to create the vertex
    parameters: number[]; // additional parameters related to this vertex
    particles: ObjectID[]; // particles that have been used to form this vertex, aka the decay particles emerging from this vertex
  }

  /** Reconstructed track */
  interface Track {
    type: number; // flagword that defines the type of track
    chi2: number; // chi-squared of the track fit
    ndf: number; // number of degrees of freedom of the track fit
    Nholes: number; // number of holes on track
    subdetectorHitNumbers: number[]; // number of hits in particular subdetectors
    subdetectorHoleNumbers: number[]; // number of holes in particular subdetectors
    trackStates: TrackState[]; // track states
    trackerHits: ObjectID[]; // hits that have been used to create this track
    tracks: ObjectID[]; // tracks (segments) that have been combined to create this track
  }

  /** Tracker hit interface class */
  // Types: TrackerHit3D, TrackerHitPlane
  interface TrackerHit {
    cellID: number; // ID of the sensor that created this hit
    type: number; // type of the raw data hit
    quality: number; // quality bit flag of the hit
    time: number; // [ns] time of the hit
    eDep: number; // [GeV] energy deposited on the hit
    eDepError: number; // [GeV] error measured on eDep
    position: Vector3d; // [mm] hit position
  }

  /** Tracker hit */
  interface TrackerHit3D extends TrackerHit {
    cellID: number; // ID of the sensor that created this hit
    type: number; // type of raw data hit
    quality: number; // quality bit flag of the hit
    time: number; // [ns] time of the hit
    eDep: number; // [GeV] energy deposited on the hit
    eDepError: number; // [GeV] error measured on eDep
    position: Vector3d; // [mm] hit position
    covMatrix: CovMatrix3f; // [mm^2] covariance matrix of the position (x,y,z)
  }

  /** Tracker hit plane */
  interface TrackerHitPlane {
    cellID: number; // ID of the sensor that created this hit
    type: number; // type of raw data hit
    quality: number; // quality bit flag of the hit
    time: number; // [ns] time of the hit
    eDep: number; // [GeV] energy deposited on the hit
    eDepError: number; // [GeV] error measured on eDep
    u: Vector2f; // measurement direction vector, u lies in the x-y plane
    v: Vector2f; // measurement direction vector, v is along z
    du: number; // measurement error along the direction
    dv: number; // measurement error along the direction
    position: Vector3d; // [mm] hit position
    covMatrix: CovMatrix3f; // [mm^2] covariance of the position (x,y,z)
  }

  /** Simulated tracker hit */
  interface SimTrackerHit {
    cellID: number; // ID of the sensor that created this hit
    eDep: number; // [GeV] energy deposited in the hit
    time: number; // [ns] proper time of the hit in the lab frame
    pathLength: number; // path length of the particle in the sensitive material that resulted in this hit
    quality: number; // quality bit flag
    position: Vector3d; // [mm] the hit position
    momentum: Vector3f; // [GeV] the 3-momentum of the particle at the hits position
    particle: ObjectID; // MCParticle that caused the hit
  }

  /** Calorimeter hit */
  interface CalorimeterHit {
    cellID: number; // detector specific (geometrical) cell id
    energy: number; // [GeV] energy of the hit
    energyError: number; // [GeV] error of the hit energy
    time: number; // [ns] time of the hit
    position: Vector3f; // [mm] position of the hit in world coordinates
    type: number; // type of hit
  }

  /** Simulated calorimeter hit */
  interface SimCalorimeterHit {
    cellID: number; // ID of the sensor that created this hit
    energy: number; // [GeV] energy of the hit
    position: Vector3f; // [mm] position of the hit in world coordinates
    contributions: ObjectID[]; // Monte Carlo step contributions
  }

  /** Calorimeter Hit Cluster */
  interface Cluster {
    type: number; // flagword that defines the type of cluster
    energy: number; // [GeV] energy of the cluster
    energyError: number; // [GeV] error on the energy
    position: Vector3f; // [mm] position of the cluster
    positionError: CovMatrix3f; // [mm^2] covariance matrix of the position
    iTheta: number; // [rad] Polar angle of the cluster's intrinsic direction (used e.g. for vertexing). Not to be confused with the cluster position seen from IP
    phi: number; // [rad] Azimuthal angle of the cluster's intrinsic direction (used e.g. for vertexing). Not to be confused with the cluster position seen from IP
    directionError: Vector3f; // [mm^2] covariance matrix of the direction
    shapeParameters: number[]; // shape parameters. The corresponding names of the shape parameters should be stored in the collection named by edm4hep::labels::ShapeParameterNames in the file-level metadata, as a vector of strings in the same order as the parameters.
    subdetectorEnergies: number[]; // energy observed in a particular subdetector
    clusters: ObjectID[]; // clusters that have been combined to this cluster
    hits: ObjectID[]; // hits that have been combined to this cluster
  }

  /** Reconstructed Particle */
  interface ReconstructedParticle {
    PDG: number; // PDG of the reconstructed particle.
    energy: number; // [GeV] energy of the reconstructed particle. Four momentum state is not kept consistent internally
    momentum: Vector3f; // [GeV]  particle momentum. Four momentum state is not kept consistent internally
    referencePoint: Vector3f; // [mm] reference, i.e. where the particle has been measured
    charge: number; // [e] charge of the reconstructed particle
    mass: number; // [GeV]  mass of the reconstructed particle, set independently from four vector. Four momentum state is not kept consistent internally
    goodnessOfPID: number; // overall goodness of the PID on a scale of [0;1]
    covMatrix: CovMatrix4f; // [GeV^2] covariance matrix of the reconstructed particle 4vector
    decayVertex: ObjectID; // decay vertex for the particle (if it is a composite particle)
    clusters: ObjectID[]; // clusters that have been used for this particle
    tracks: ObjectID[]; // tracks that have been used for this particle
    particles: ObjectID[]; // reconstructed particles that have been combined to this particle
  }

  type TrackStateCollection = TrackState[];
  type VertexCollection = Vertex[];
  type TrackCollection = Track[];
  type TrackerHitCollection = (TrackerHit3D | TrackerHitPlane)[];
  type SimTrackerHitCollection = SimTrackerHit[];
  type CalorimeterHitCollection = CalorimeterHit[];
  type SimCalorimeterHitCollection = SimCalorimeterHit[];
  type ClusterCollection = Cluster[];
  type ReconstructedParticleCollection = ReconstructedParticle[];
}
