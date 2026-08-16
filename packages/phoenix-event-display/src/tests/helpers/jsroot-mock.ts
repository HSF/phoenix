/**
 * Mock for jsroot ESM modules.
 *
 * jsroot ships as ESM-only (.mjs) which cannot be parsed by Jest's
 * CommonJS pipeline with newer TypeScript versions. Most tests don't
 * use jsroot functionality — they just transitively import
 * event-display.ts which imports it.
 */

// jsroot main module exports
export const httpRequest = jest.fn();
export const openFile = jest.fn();
export const settings = {};

// jsroot/geom exports
export const build = jest.fn();

// jsroot/tree exports
export class TSelector {
  tgtobj: { [key: string]: any } = {};
  /** Branch name -> key it is read into, in registration order. */
  branches: { branch: string; key: string }[] = [];
  aborted = false;

  addBranch(branch: string, key?: string) {
    this.branches.push({ branch, key: key ?? branch });
    return this.branches.length - 1;
  }

  numBranches() {
    return this.branches.length;
  }

  Process(_entry: number) {}

  Abort() {
    this.aborted = true;
  }
}

/**
 * Drives selector.Process once per entry. Tests seed the data by setting
 * `selector.tgtobj` from a `treeProcess.mockImplementation`.
 */
export const treeProcess = jest.fn(
  async (_tree: any, selector: any, args?: { numentries?: number }) => {
    const n = args?.numentries ?? 1;
    for (let i = 0; i < n && !selector.aborted; i++) selector.Process(i);
  },
);
