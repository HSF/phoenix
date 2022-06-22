import { Object3D } from 'three';

/**
 * Parameters used when adding geometry to UI menus.
 */
export type GeometryUIParameters = {
  /** Object to add to the UI menu. */
  object: Object3D;
  /** Path to the node in Phoenix menu to add the geometry to. Use `>` as a separator. */
  menuNodeName?: string;
};
