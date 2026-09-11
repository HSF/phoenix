/**
 * Configuration for a single column in the kinematics panel.
 * Experiment-agnostic — each experiment provides its own column definitions.
 */
export interface KinematicsColumn {
  /** Column identifier, used for sorting. */
  id: string;
  /** Display label for the column header. */
  label: string;
  /** Unit string shown in header as "label (unit)". */
  unit?: string;
  /** Tooltip text shown on hover — helps students learn physics quantities. */
  tooltip?: string;
  /** Extract the display value from a physics object's userData. */
  getter: (objectData: any) => number | string;
  /** Decimal places for numeric values. Defaults to 1. */
  precision?: number;
}

/**
 * Configuration for the kinematics panel.
 * Experiment-agnostic — each experiment provides its own config.
 */
export interface KinematicsConfig {
  /** Display title for the panel header. */
  title: string;
  /** Collection group type to filter (e.g., 'Tracks', 'Jets'). */
  collectionType?: string;
  /** Column definitions. */
  columns: KinematicsColumn[];
  /** Default sort column ID. */
  defaultSort?: string;
  /** Default sort direction. */
  defaultSortDirection?: 'asc' | 'desc';
  /** Column ID for the threshold filter. If set, shows a min-value filter input. */
  filterColumn?: string;
}

/** Default ATLAS track kinematics config for JiveXML/PHYSLITE data. */
export const ATLAS_KINEMATICS: KinematicsConfig = {
  title: 'Track Momenta',
  collectionType: 'Tracks',
  defaultSort: 'pT',
  defaultSortDirection: 'desc',
  filterColumn: 'pT',
  columns: [
    {
      id: 'pT',
      label: 'pT',
      unit: 'GeV',
      tooltip: 'Transverse momentum',
      getter: (t) => (t.pT ?? 0) / 1000,
      precision: 1,
    },
    {
      id: 'eta',
      label: '\u03B7',
      tooltip: 'Pseudorapidity',
      getter: (t) => t.eta ?? 0,
      precision: 2,
    },
    {
      id: 'phi',
      label: '\u03C6',
      tooltip: 'Azimuthal angle',
      getter: (t) => t.phi ?? 0,
      precision: 2,
    },
    {
      id: 'charge',
      label: 'q',
      tooltip: 'Electric charge',
      getter: (t) => {
        if (t.charge != null) return t.charge;
        const qOverP = t.dparams?.[4];
        return qOverP ? Math.sign(qOverP) : 0;
      },
      precision: 0,
    },
    {
      id: 'p',
      label: '|p|',
      unit: 'GeV',
      tooltip: 'Total momentum',
      getter: (t) => {
        const qOverP = t.dparams?.[4];
        if (!qOverP || !isFinite(1 / qOverP)) return 0;
        return Math.abs(1 / qOverP) / 1000;
      },
      precision: 1,
    },
  ],
};
