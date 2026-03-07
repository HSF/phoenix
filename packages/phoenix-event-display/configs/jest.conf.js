/* eslint-disable no-undef */

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  rootDir: '../',
  roots: ['<rootDir>/src/tests'],
  preset: 'ts-jest/presets/js-with-ts-legacy',
  moduleNameMapper: {
    // Mock ESM-only dependencies that break Jest's CommonJS pipeline
    // with newer TypeScript versions. These modules ship .mjs files
    // that ts-jest cannot transform on TS 5.6+.
    '^three/examples/jsm/(.*)$': '<rootDir>/src/tests/helpers/three-jsm-mock',
    '^jsroot(.*)$': '<rootDir>/src/tests/helpers/jsroot-mock',
    '^@angular/core$': '<rootDir>/src/tests/helpers/angular-core-mock',
    // Strip .js extensions from relative TypeScript imports
    '^(\\.{1,2}/.+)\\.js$': '$1',
  },
  transform: {
    '^.+\\.m?[tj]s$': [
      'ts-jest',
      {
        tsconfig: {
          rootDir: null,
          allowJs: true,
        },
        astTransformers: {
          before: [
            {
              path: 'ts-jest-mock-import-meta',
              options: {
                metaObjectReplacement: { url: '' },
              },
            },
          ],
        },
      },
    ],
  },
  transformIgnorePatterns: ['<rootDir>/node_modules/(?!three/examples/jsm)'],
  testRegex: '\\.test.ts$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  verbose: true,
  collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
  clearMocks: true,
  extensionsToTreatAsEsm: ['.ts'],
};
