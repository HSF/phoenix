/**
 * Adapter giving command handlers access to the live Phoenix instance.
 * Built by EventDisplay.buildCommandHost(), mirroring buildSessionHost().
 */
export interface CommandHost {
  /** The EventDisplay facade. */
  eventDisplay: any;
  /** The UI manager (theme, views, geometry visibility, clipping, axis). */
  ui: any;
  /** The three.js manager (camera projection, scene). */
  three: any;
  /** The state manager (camera/clipping/menu/cut state). */
  state: any;
  /** Emit an event on the Phoenix event bus. */
  emit: (eventName: string, data?: any) => void;
  /** Resolve an object's uuid from its collection name and row index. */
  resolveObject: (
    collection: string,
    index: number,
  ) => { uuid: string } | undefined;
  /** Names of the geometry parts available for the 'part' enum. */
  listGeometryParts: () => string[];
}
