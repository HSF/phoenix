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
