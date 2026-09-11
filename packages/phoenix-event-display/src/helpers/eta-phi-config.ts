/** Configuration for the eta-phi energy map panel. */
export interface EtaPhiConfig {
  /** Eta axis range. Defaults to [-5, 5]. */
  etaRange?: [number, number];
  /** Phi axis range in radians. Defaults to [-pi, pi]. */
  phiRange?: [number, number];
  /** Number of bins along eta. Defaults to 100. */
  etaBins?: number;
  /** Number of bins along phi. Defaults to 63. */
  phiBins?: number;
  /** Minimum energy (GeV) to display. Defaults to 0 (hide noise). */
  energyThreshold?: number;
  /** Use logarithmic color scale. Defaults to true. */
  logScale?: boolean;
}

/** Default ATLAS-style eta-phi configuration. */
export const DEFAULT_ETA_PHI_CONFIG: Required<EtaPhiConfig> = {
  etaRange: [-5, 5],
  phiRange: [-Math.PI, Math.PI],
  etaBins: 100,
  phiBins: 63,
  energyThreshold: 0,
  logScale: true,
};
