import {
  CovMatrix3f,
  CovMatrix4f,
  CovMatrix6f,
  Vector2f,
  Vector3f,
  Vector3d,
  ObjectID,
} from './utils';

export namespace Schema3 {
  /** Vertex */
  export type Vertex = {
    type: number; // flagword that defines the type of the vertex, see reserved bits for more information
    chi2: number; // chi-squared of the vertex fit
    ndf: number; // number of degrees of freedom of the vertex fit
    position: Vector3f; // [mm]  position of the vertex
    covMatrix: CovMatrix3f; // [mm^2] covariance matrix of the position
    algorithmType: number; // type code for the algorithm that has been used to create the vertex
    parameters: number[]; // additional parameters related to this vertex
    particles: ObjectID[]; // particles that have been used to form this vertex, aka the decay particles emerging from this vertex
  };

  /** Parametrized description of a particle track */
  type TrackState = {
    location: number; // for use with At{Other|IP|FirstHit|LastHit|Calorimeter|Vertex}|LastLocation
    D0: number; // transverse impact parameter
    phi: number; // [rad] azimuthal angle of the track at this location (i.e. not phi0)
    omega: number; // [1/mm] is the signed curvature of the track
    Z0: number; // longitudinal impact parameter
    tanLambda: number; // lambda is the dip angle of the track in r-z
    time: number; // [ns] time of the track at this trackstate
    referencePoint: Vector3f; // [mm] Reference point of the track parameters, e.g. the origin at the IP, or the position  of the first/last hits or the entry point into the calorimeter
    covMatrix: CovMatrix6f; // covariance matrix of the track parameters.
  };

  /** Reconstructed track */
  export type Track = {
    type: number; // flagword that defines the type of track
    chi2: number; // chi-squared of the track fit
    ndf: number; // number of degrees of freedom of the track fit
    Nholes: number; // number of holes on track
    subdetectorHitNumbers: number[]; // number of hits in particular subdetectors
    subdetectorHoleNumbers: number[]; // number of holes in particular subdetectors
    trackStates: TrackState[]; // track states
    trackerHits: ObjectID[]; // hits that have been used to create this track
    tracks: ObjectID[]; // tracks (segments) that have been combined to create this track
  };

  /** Tracker hit interface class */
  // Types: TrackerHit3D, TrackerHitPlane
  interface TrackerHit {
    cellID: bigint; // ID of the sensor that created this hit
    type: number; // type of the raw data hit
    quality: number; // quality bit flag of the hit
    time: number; // [ns] time of the hit
    eDep: number; // [GeV] energy deposited on the hit
    eDepError: number; // [GeV] error measured on eDep
    position: Vector3d; // [mm] hit position
  }

  /** Tracker hit */
  export interface TrackerHit3D extends TrackerHit {
    cellID: bigint; // ID of the sensor that created this hit
    type: number; // type of raw data hit
    quality: number; // quality bit flag of the hit
    time: number; // [ns] time of the hit
    eDep: number; // [GeV] energy deposited on the hit
    eDepError: number; // [GeV] error measured on eDep
    position: Vector3d; // [mm] hit position
    covMatrix: CovMatrix3f; // [mm^2] covariance matrix of the position (x,y,z)
  }

  /** Tracker hit plane */
  export interface TrackerHitPlane extends TrackerHit {
    cellID: bigint; // ID of the sensor that created this hit
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
  export type SimTrackerHit = {
    cellID: bigint; // ID of the sensor that created this hit
    eDep: number; // [GeV] energy deposited in the hit
    time: number; // [ns] proper time of the hit in the lab frame
    pathLength: number; // path length of the particle in the sensitive material that resulted in this hit
    quality: number; // quality bit flag
    position: Vector3d; // [mm] the hit position
    momentum: Vector3f; // [GeV] the 3-momentum of the particle at the hits position
    particle: ObjectID; // MCParticle that caused the hit
  };

  /** Calorimeter hit */
  export type CalorimeterHit = {
    cellID: bigint; // detector specific (geometrical) cell id
    energy: number; // [GeV] energy of the hit
    energyError: number; // [GeV] error of the hit energy
    time: number; // [ns] time of the hit
    position: Vector3f; // [mm] position of the hit in world coordinates
    type: number; // type of hit
  };

  /** Simulated calorimeter hit */
  export type SimCalorimeterHit = {
    cellID: bigint; // ID of the sensor that created this hit
    energy: number; // [GeV] energy of the hit
    position: Vector3f; // [mm] position of the hit in world coordinates
    contributions: ObjectID[]; // Monte Carlo step contributions
  };

  /** Calorimeter Hit Cluster */
  export type Cluster = {
    type: number; // flagword that defines the type of cluster
    energy: number; // [GeV] energy of the cluster
    energyError: number; // [GeV] error on the energy
    position: Vector3f; // [mm] position of the cluster
    positionError: CovMatrix3f; // [mm^2] covariance matrix of the position
    iTheta: number; // [rad] Polar angle of the cluster's intrinsic direction (used e.g. for vertexing). Not to be confused with the cluster position seen from IP
    phi: number; // [rad] Azimuthal angle of the cluster's intrinsic direction (used e.g. for vertexing). Not to be confused with the cluster position seen from IP
    directionError: Vector3f; // [mm^2] covariance matrix of the direction
    shapeParameters: number[]; // shape parameters. This should be accompanied by a descriptive list of names in the shapeParameterNames collection level metadata, as a vector of strings with the same ordering
    subdetectorEnergies: number[]; // energy observed in a particular subdetector
    clusters: ObjectID[]; // clusters that have been combined to this cluster
    hits: ObjectID[]; // hits that have been combined to this cluster
  };

  /** Reconstructed Particle */
  export type ReconstructedParticle = {
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
  };

  /** Event Header. Additional parameters are assumed to go into the metadata tree. */
  export type EventHeader = {
    eventNumber: bigint; // event number
    runNumber: number; // run number
    timeStamp: bigint; // time stamp
    weight: number; // event weight
    weights: number[]; // event weights in case there are multiple. **NOTE that weights[0] might not be the same as weight!** Event weight names should be stored using the edm4hep::EventWeights name in the file level metadata
  };


  /** Link between a ReconstructedParticle and an MCParticle */
  export type RecoMCParticleLink = {
    weight: number; // weight of this link
    from: ObjectID; // reference to the reconstructed particle
    to: ObjectID; // reference to the Monte-Carlo particle
  };

  /** The Monte Carlo particle - based on the lcio::MCParticle. */
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
    spin: Vector3f; // spin (helicity) vector of the particle
    parents: ObjectID[]; // The parents of this particle
    daughters: ObjectID[]; // The daughters this particle
  };

  export type EventHeaderCollection = EventHeader[];
  export type VertexCollection = Vertex[];
  export type TrackCollection = Track[];
  export type TrackerHit3DCollection = TrackerHit3D[];
  export type TrackerHitPlaneCollection = TrackerHitPlane[];
  export type SimTrackerHitCollection = SimTrackerHit[];
  export type CalorimeterHitCollection = CalorimeterHit[];
  export type SimCalorimeterHitCollection = SimCalorimeterHit[];
  export type ClusterCollection = Cluster[];
  export type ReconstructedParticleCollection = ReconstructedParticle[];
  export type RecoMCParticleLinkCollection = RecoMCParticleLink[];
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
        collType: 'edm4hep::TrackerHit3DCollection';
        collection: TrackerHit3DCollection;
      }
    | {
        collID: number;
        collSchemaVersion: number;
        collType: 'edm4hep::TrackerHitPlaneCollection';
        collection: TrackerHitPlaneCollection;
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
        collType: 'podio::LinkCollection<edm4hep::ReconstructedParticle,edm4hep::MCParticle>';
        collection: RecoMCParticleLinkCollection;
      }
    | {
        collID: number;
        collSchemaVersion: number;
        collType: 'edm4hep::MCParticleCollection';
        collection: MCParticleCollection;
      };
}
