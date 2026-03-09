import { Vector3f, Vector3d, Vector2i, ObjectID } from './utils';

export namespace Schema1 {
  /** Vertex */
  export type Vertex = {
    primary: number; // boolean flag, if vertex is the primary vertex of the event
    chi2: number; // chi-squared of the vertex fit
    probability: number; // probability of the vertex fit
    position: Vector3f; // [mm] position of the vertex.
    covMatrix: number[]; // covariance matrix of the position (stored as lower triangle matrix, i.e. cov(xx),cov(y,x),cov(z,x),cov(y,y),... )
    algorithmType: number; // type code for the algorithm that has been used to create the vertex - check/set the collection parameters AlgorithmName and AlgorithmType.
    parameters: number[]; // additional parameters related to this vertex - check/set the collection parameter "VertexParameterNames" for the parameters meaning.
    associatedParticle: ObjectID; // reconstructed particle associated to this vertex.
  };

  export type TrackState = {
    location: number; // for use with At{Other|IP|FirstHit|LastHit|Calorimeter|Vertex}|LastLocation
    D0: number; // transverse impact parameter
    phi: number; // azimuthal angle
    omega: number; // is the signed curvature of the track in [1/mm].
    Z0: number; // longitudinal impact parameter
    tanLambda: number; // lambda is the dip angle of the track in r-z
    time: number; // time of the track at this trackstate
    referencePoint: Vector3f; // Reference point of the track parameters, e.g. the origin at the IP, or the position  of the first/last hits or the entry point into the calorimeter. [mm]
    covMatrix: number[]; // lower triangular covariance matrix of the track parameters.  the order of parameters is  d0, phi, omega, z0, tan(lambda), time. the array is a row-major flattening of the matrix.
  };

  /** Reconstructed track */
  export type Track = {
    type: number; // flagword that defines the type of track.Bits 16-31 are used internally
    chi2: number; // Chi^2 of the track fit
    ndf: number; // number of degrees of freedom of the track fit
    dEdx: number; // dEdx of the track.
    dEdxError: number; // error of dEdx.
    radiusOfInnermostHit: number; // radius of the innermost hit that has been used in the track fit
    subdetectorHitNumbers: number[]; // number of hits in particular subdetectors.Check/set collection variable TrackSubdetectorNames for decoding the indices
    trackStates: TrackState[]; // track states
    dxQuantities: {
      error: number;
      type: number;
      value: number;
    }[]; // different measurements of dx quantities
    trackerHits: ObjectID[]; // hits that have been used to create this track
    tracks: ObjectID[]; // tracks (segments) that have been combined to create this track
  };

  /** Tracker hit */
  export type TrackerHit = {
    cellID: bigint; // ID of the sensor that created this hit
    type: number; // type of raw data hit, either one of edm4hep::RawTimeSeries, edm4hep::SIMTRACKERHIT - see collection parameters "TrackerHitTypeNames" and "TrackerHitTypeValues".
    quality: number; // quality bit flag of the hit.
    time: number; // time of the hit [ns].
    eDep: number; // energy deposited on the hit [GeV].
    eDepError: number; // error measured on EDep [GeV].
    position: Vector3d; // hit position in [mm].
    covMatrix: number[]; // covariance of the position (x,y,z), stored as lower triangle matrix. i.e. cov(x,x) , cov(y,x) , cov(y,y) , cov(z,x) , cov(z,y) , cov(z,z)
    rawHits: ObjectID[]; // raw data hits. Check getType to get actual data type.
  };

  /** Simulated tracker hit */
  export type SimTrackerHit = {
    cellID: bigint; // ID of the sensor that created this hit
    EDep: number; // energy deposited in the hit [GeV].
    time: number; // proper time of the hit in the lab frame in [ns].
    pathLength: number; // path length of the particle in the sensitive material that resulted in this hit.
    quality: number; // quality bit flag.
    position: Vector3d; // the hit position in [mm].
    momentum: Vector3f; // the 3-momentum of the particle at the hits position in [GeV]
    MCParticle: ObjectID; // MCParticle that caused the hit.
  };

  /** Calorimeter hit */
  export type CalorimeterHit = {
    cellID: bigint; // detector specific (geometrical) cell id.
    energy: number; // energy of the hit in [GeV].
    energyError: number; // error of the hit energy in [GeV].
    time: number; // time of the hit in [ns].
    position: Vector3f; // position of the hit in world coordinates in [mm].
    type: number; // type of hit. Mapping of integer types to names via collection parameters "CalorimeterHitTypeNames" and "CalorimeterHitTypeValues".
  };

  /** Simulated calorimeter hit */
  export type SimCalorimeterHit = {
    cellID: bigint; // ID of the sensor that created this hit
    energy: number; // energy of the hit in [GeV].
    position: Vector3f; // position of the hit in world coordinates in [mm].
    contributions: ObjectID[]; // Monte Carlo step contribution - parallel to particle
  };

  /** Calorimeter Hit Cluster */
  export type Cluster = {
    type: number; // flagword that defines the type of cluster. Bits 16-31 are used internally.
    energy: number; // energy of the cluster [GeV]
    energyError: number; // error on the energy
    position: Vector3f; // position of the cluster [mm]
    positionError: number[]; // covariance matrix of the position (6 Parameters)
    iTheta: number; // intrinsic direction of cluster at position  Theta. Not to be confused with direction cluster is seen from IP.
    phi: number; // intrinsic direction of cluster at position - Phi. Not to be confused with direction cluster is seen from IP.
    directionError: Vector3f; // covariance matrix of the direction (3 Parameters) [mm^2]
    shapeParameters: number[]; // shape parameters - check/set collection parameter ClusterShapeParameters for size and names of parameters.
    subdetectorEnergies: number[]; // energy observed in a particular subdetector. Check/set collection parameter ClusterSubdetectorNames for decoding the indices of the array.
    clusters: ObjectID[]; // clusters that have been combined to this cluster.
    hits: ObjectID[]; // hits that have been combined to this cluster.
    particleIDs: ObjectID[]; // particle IDs (sorted by their likelihood)
  };

  /** Reconstructed Particle */
  export type ReconstructedParticle = {
    type: number; // type of reconstructed particle. Check/set collection parameters ReconstructedParticleTypeNames and ReconstructedParticleTypeValues.
    energy: number; // [GeV] energy of the reconstructed particle. Four momentum state is not kept consistent internally.
    momentum: Vector3f; // [GeV] particle momentum. Four momentum state is not kept consistent internally.
    referencePoint: Vector3f; // [mm] reference, i.e. where the particle has been measured
    charge: number; // charge of the reconstructed particle.
    mass: number; // [GeV] mass of the reconstructed particle, set independently from four vector. Four momentum state is not kept consistent internally.
    goodnessOfPID: number; // overall goodness of the PID on a scale of [0;1]
    covMatrix: number[]; // cvariance matrix of the reconstructed particle 4vector (10 parameters). Stored as lower triangle matrix of the four momentum (px,py,pz,E), i.e. cov(px,px), cov(py,##
    startVertex: ObjectID; // start vertex associated to this particle
    particleIDUsed: ObjectID; // particle Id used for the kinematics of this particle
    clusters: ObjectID[]; // clusters that have been used for this particle.
    tracks: ObjectID[]; // tracks that have been used for this particle.
    particles: ObjectID[]; // reconstructed particles that have been combined to this particle.
    particleIDs: ObjectID[]; // particle Ids (not sorted by their likelihood)
  };

  /** Event Header. Additional parameters are assumed to go into the metadata tree. */
  export type EventHeader = {
    eventNumber: number; // event number
    runNumber: number; // run number
    timeStamp: bigint; // time stamp
    weight: number; // event weight
  };

  /** Used to keep track of the correspondence between MC and reconstructed particles */
  export type MCRecoParticleAssociation = {
    weight: number; // weight of this association
    rec: ObjectID; // reference to the reconstructed particle
    sim: ObjectID; // reference to the Monte-Carlo particle
  };

  /** The Monte Carlo particle - based on the lcio::MCParticle. */
  export type MCParticle = {
    PDG: number; // PDG code of the particle
    generatorStatus: number; // status of the particle as defined by the generator
    simulatorStatus: number; // status of the particle from the simulation program - use BIT constants below
    charge: number; // particle charge
    time: number; // creation time of the particle in [ns] wrt. the event, e.g. for preassigned decays or decays in flight from the simulator.
    mass: number; // mass of the particle in [GeV]
    vertex: Vector3d; // production vertex of the particle in [mm].
    endpoint: Vector3d; // endpoint of the particle in [mm]
    momentum: Vector3f; // particle 3-momentum at the production vertex in [GeV]
    momentumAtEndpoint: Vector3f; // particle 3-momentum at the endpoint in [GeV]
    spin: Vector3f; // spin (helicity) vector of the particle.
    colorFlow: Vector2i; // color flow as defined by the generator
    parents: ObjectID[]; // The parents of this particle.
    daughters: ObjectID[]; // The daughters this particle.
  };

  export type EventHeaderCollection = EventHeader[];
  export type VertexCollection = Vertex[];
  export type TrackCollection = Track[];
  export type TrackerHitCollection = TrackerHit[];
  export type SimTrackerHitCollection = SimTrackerHit[];
  export type CalorimeterHitCollection = CalorimeterHit[];
  export type SimCalorimeterHitCollection = SimCalorimeterHit[];
  export type ClusterCollection = Cluster[];
  export type ReconstructedParticleCollection = ReconstructedParticle[];
  export type MCRecoParticleAssociationCollection = MCRecoParticleAssociation[];
  export type MCParticleCollection = MCParticle[];

  export type Item =
    | {
        collID: number;
        collSchemaVersion: number;
        collType: 'edm4hep::EventHeaderCollection';
        collection: EventHeaderCollection;
      }
    | {
        collID: number;
        collSchemaVersion: number;
        collType: 'edm4hep::VertexCollection';
        collection: VertexCollection;
      }
    | {
        collID: number;
        collSchemaVersion: number;
        collType: 'edm4hep::TrackCollection';
        collection: TrackCollection;
      }
    | {
        collID: number;
        collSchemaVersion: number;
        collType: 'edm4hep::TrackerHitCollection';
        collection: TrackerHitCollection;
      }
    | {
        collID: number;
        collSchemaVersion: number;
        collType: 'edm4hep::SimTrackerHitCollection';
        collection: SimTrackerHitCollection;
      }
    | {
        collID: number;
        collSchemaVersion: number;
        collType: 'edm4hep::CalorimeterHitCollection';
        collection: CalorimeterHitCollection;
      }
    | {
        collID: number;
        collSchemaVersion: number;
        collType: 'edm4hep::SimCalorimeterHitCollection';
        collection: SimCalorimeterHitCollection;
      }
    | {
        collID: number;
        collSchemaVersion: number;
        collType: 'edm4hep::ClusterCollection';
        collection: ClusterCollection;
      }
    | {
        collID: number;
        collSchemaVersion: number;
        collType: 'edm4hep::ReconstructedParticleCollection';
        collection: ReconstructedParticleCollection;
      }
    | {
        collID: number;
        collSchemaVersion: number;
        collType: 'edm4hep::MCRecoParticleAssociation';
        collection: MCRecoParticleAssociationCollection;
      };
}
