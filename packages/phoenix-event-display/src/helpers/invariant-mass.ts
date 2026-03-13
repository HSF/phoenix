/** A Lorentz 4-momentum vector (E, px, py, pz) in MeV. */
export interface FourMomentum {
  E: number;
  px: number;
  py: number;
  pz: number;
}

/** A tagged particle with its physics properties. */
export interface TaggedParticle {
  uuid: string;
  tag: string;
  fourMomentum: FourMomentum;
  /** Display-friendly properties. */
  pT: number;
  eta: number;
  phi: number;
}

/** Definition of a particle tag for use in masterclass exercises. */
export interface ParticleTagDef {
  /** Unique identifier, e.g. 'electron', 'kaon'. */
  id: string;
  /** Human-readable label, e.g. 'Electron'. */
  label: string;
  /** Symbol for display, e.g. 'e\u00B1', 'K\u00B1'. */
  symbol: string;
  /** CSS color for the tag button and badge. */
  color: string;
  /** Rest mass in MeV/c\u00B2. */
  mass: number;
}

/**
 * Configuration for experiment-specific masterclass exercises.
 * Each experiment (ATLAS, LHCb, CMS, ...) provides its own config.
 */
export interface MasterclassConfig {
  /** Panel title, e.g. 'ATLAS Z-Path Masterclass'. */
  title: string;
  /** Available particle tags for this exercise. */
  particleTags: ParticleTagDef[];
  /** Educational hints shown when invariant mass is computed. */
  hints: string[];
  /**
   * Classify an event from the tag counts.
   * Receives a map of tag id to count, e.g. { electron: 2, muon: 0 }.
   * Returns a short label like "e", "4e", "2e2m".
   */
  classifyEvent: (tagCounts: Record<string, number>) => string;
}

/**
 * Extract a 4-momentum vector from track userData.
 * Tracks have pT, eta/phi (or dparams), and we assign mass from the tag definition.
 * @param userData Track user data containing kinematic properties.
 * @param mass Particle rest mass in MeV/c².
 */
export function fourMomentumFromTrack(
  userData: any,
  mass: number,
): FourMomentum | null {
  const pT = userData.pT;
  if (pT == null) return null;

  const phi = userData.phi ?? userData.dparams?.[2];
  // theta from dparams, or compute from eta
  let theta = userData.dparams?.[3];
  if (theta == null && userData.eta != null) {
    theta = 2 * Math.atan(Math.exp(-userData.eta));
  }
  if (phi == null || theta == null) return null;

  const px = pT * Math.cos(phi);
  const py = pT * Math.sin(phi);
  const pz = pT / Math.tan(theta);
  const p2 = px * px + py * py + pz * pz;
  const E = Math.sqrt(p2 + mass * mass);

  return { E, px, py, pz };
}

/**
 * Extract a 4-momentum vector from a calorimeter cluster.
 * Clusters have energy, eta, phi — treated as massless.
 */
export function fourMomentumFromCluster(userData: any): FourMomentum | null {
  const energy = userData.energy;
  const eta = userData.eta;
  const phi = userData.phi;
  if (energy == null || eta == null || phi == null) return null;

  const theta = 2 * Math.atan(Math.exp(-eta));
  const px = energy * Math.sin(theta) * Math.cos(phi);
  const py = energy * Math.sin(theta) * Math.sin(phi);
  const pz = energy * Math.cos(theta);

  return { E: energy, px, py, pz };
}

/**
 * Compute the invariant mass of a set of particles in MeV.
 * M² = (ΣE)² - (Σpx)² - (Σpy)² - (Σpz)²
 */
export function invariantMass(momenta: FourMomentum[]): number {
  if (momenta.length < 2) return 0;

  let sumE = 0,
    sumPx = 0,
    sumPy = 0,
    sumPz = 0;
  for (const p of momenta) {
    sumE += p.E;
    sumPx += p.px;
    sumPy += p.py;
    sumPz += p.pz;
  }

  const m2 = sumE * sumE - sumPx * sumPx - sumPy * sumPy - sumPz * sumPz;
  return m2 > 0 ? Math.sqrt(m2) : 0;
}

/**
 * Default event classifier for ATLAS Z-path masterclass.
 * Classifies events by electron/muon/photon counts.
 */
export function atlasClassifyEvent(tagCounts: Record<string, number>): string {
  const e = tagCounts['electron'] ?? 0;
  const m = tagCounts['muon'] ?? 0;
  const g = tagCounts['photon'] ?? 0;

  if (e === 2 && m === 0 && g === 0) return 'e';
  if (e === 0 && m === 2 && g === 0) return 'm';
  if (e === 0 && m === 0 && g === 2) return 'g';
  if (e === 4 && m === 0 && g === 0) return '4e';
  if (e === 2 && m === 2 && g === 0) return '2e2m';
  if (e === 0 && m === 4 && g === 0) return '4m';

  const parts: string[] = [];
  if (e > 0) parts.push(`${e}e`);
  if (m > 0) parts.push(`${m}m`);
  if (g > 0) parts.push(`${g}g`);
  return parts.join('') || '?';
}

/** Default masterclass configuration for ATLAS Z-path exercises. */
export const ATLAS_MASTERCLASS_CONFIG: MasterclassConfig = {
  title: 'Masterclass \u2014 Invariant Mass',
  particleTags: [
    {
      id: 'electron',
      label: 'Electron',
      symbol: 'e\u00B1',
      color: '#f0c040',
      mass: 0.511,
    },
    {
      id: 'muon',
      label: 'Muon',
      symbol: '\u03BC\u00B1',
      color: '#40c060',
      mass: 105.658,
    },
    {
      id: 'photon',
      label: 'Photon',
      symbol: '\u03B3',
      color: '#e04040',
      mass: 0,
    },
  ],
  hints: [
    'Z boson \u2248 91 GeV',
    'Higgs \u2248 125 GeV',
    'J/\u03C8 \u2248 3.1 GeV',
  ],
  classifyEvent: atlasClassifyEvent,
};
