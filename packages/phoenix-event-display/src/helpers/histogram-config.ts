/**
 * Configuration for a histogram panel.
 * Experiment-agnostic — each experiment provides its own config.
 */
export interface HistogramConfig {
  /** Display title for the histogram. */
  title: string;
  /** X-axis label. */
  xlabel: string;
  /** Y-axis label. */
  ylabel: string;
  /** Number of bins. */
  nbins: number;
  /** X-axis minimum value. */
  xmin: number;
  /** X-axis maximum value. */
  xmax: number;
  /** ROOT line color index. */
  lineColor: number;
  /** ROOT fill color index. */
  fillColor: number;
  /** ROOT fill style. */
  fillStyle: number;
  /** Event bus event name to subscribe to. Defaults to 'result-recorded'. */
  eventName?: string;
  /** Reference lines for known resonances. */
  hints?: HistogramHint[];
  /** Guidance text shown when histogram is empty. */
  emptyText?: string;
}

/** A reference line marking a known physics resonance. */
export interface HistogramHint {
  /** Mass value in GeV. */
  mass: number;
  /** Label to display. */
  label: string;
  /** CSS color for the line. */
  color?: string;
}

/** Default ATLAS Z-path masterclass histogram config. */
export const ATLAS_MASS_HISTOGRAM: HistogramConfig = {
  title: 'Invariant Mass',
  xlabel: 'Mass (GeV)',
  ylabel: 'Entries',
  nbins: 50,
  xmin: 20,
  xmax: 120,
  lineColor: 857,
  fillColor: 857,
  fillStyle: 1001,
  hints: [{ mass: 91.2, label: 'Z', color: '#40c0f0' }],
  emptyText: 'Tag particles in the masterclass panel to fill this histogram',
};

/** ATLAS J/psi-path masterclass histogram config. */
export const ATLAS_JPSI_HISTOGRAM: HistogramConfig = {
  title: 'Invariant Mass',
  xlabel: 'Mass (GeV)',
  ylabel: 'Entries',
  nbins: 50,
  xmin: 1,
  xmax: 5,
  lineColor: 857,
  fillColor: 857,
  fillStyle: 1001,
  hints: [{ mass: 3.1, label: 'J/\u03C8', color: '#f0c040' }],
  emptyText: 'Tag particles in the masterclass panel to fill this histogram',
};

/** ATLAS wide-range histogram config (Z + Higgs). */
export const ATLAS_WIDE_HISTOGRAM: HistogramConfig = {
  title: 'Invariant Mass',
  xlabel: 'Mass (GeV)',
  ylabel: 'Entries',
  nbins: 60,
  xmin: 0,
  xmax: 200,
  lineColor: 857,
  fillColor: 857,
  fillStyle: 1001,
  hints: [
    { mass: 3.1, label: 'J/\u03C8', color: '#f0c040' },
    { mass: 91.2, label: 'Z', color: '#40c0f0' },
    { mass: 125.1, label: 'H', color: '#f07040' },
  ],
  emptyText: 'Tag particles in the masterclass panel to fill this histogram',
};
