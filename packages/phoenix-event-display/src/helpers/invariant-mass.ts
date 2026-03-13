/** Particle type tags for masterclass tagging. */
export type ParticleTag = 'electron' | 'muon' | 'photon';

/** Particle rest masses in MeV/c². */
const PARTICLE_MASSES: Record<ParticleTag, number> = {
  electron: 0.511,
  muon: 105.658,
  photon: 0,
};

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
  tag: ParticleTag;
  fourMomentum: FourMomentum;
  /** Display-friendly properties. */
  pT: number;
  eta: number;
  phi: number;
}

/**
 * Extract a 4-momentum vector from track userData.
 * Tracks have pT, eta/phi (or dparams), and we assign mass by tag.
 */
export function fourMomentumFromTrack(
  userData: any,
  tag: ParticleTag,
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
  const mass = PARTICLE_MASSES[tag];
  const E = Math.sqrt(p2 + mass * mass);

  return { E, px, py, pz };
}

/**
 * Extract a 4-momentum vector from a calorimeter cluster (photon).
 * Clusters have energy, eta, phi — treated as massless.
 */
export function fourMomentumFromCluster(userData: any): FourMomentum | null {
  const energy = userData.energy;
  const eta = userData.eta;
  const phi = userData.phi;
  if (energy == null || eta == null || phi == null) return null;

  // Massless: |p| = E, direction from eta/phi
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
 * Classify the event type from a set of tagged particles.
 * Returns: "e", "m", "g", "4e", "2e2m", "4m", or a custom string.
 */
export function classifyEventType(tags: ParticleTag[]): string {
  let e = 0,
    m = 0,
    g = 0;
  for (const tag of tags) {
    if (tag === 'electron') e++;
    else if (tag === 'muon') m++;
    else if (tag === 'photon') g++;
  }

  // Standard Z/Higgs masterclass classifications
  if (e === 2 && m === 0 && g === 0) return 'e';
  if (e === 0 && m === 2 && g === 0) return 'm';
  if (e === 0 && m === 0 && g === 2) return 'g';
  if (e === 4 && m === 0 && g === 0) return '4e';
  if (e === 2 && m === 2 && g === 0) return '2e2m';
  if (e === 0 && m === 4 && g === 0) return '4m';

  // Fallback: descriptive string
  const parts: string[] = [];
  if (e > 0) parts.push(`${e}e`);
  if (m > 0) parts.push(`${m}m`);
  if (g > 0) parts.push(`${g}g`);
  return parts.join('') || '?';
}
