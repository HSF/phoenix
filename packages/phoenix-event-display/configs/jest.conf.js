/* eslint-disable no-undef */

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  rootDir: '../',
  roots: ['<rootDir>/src/tests'],
  preset: 'ts-jest/presets/js-with-ts-legacy',
  moduleNameMapper: {
    '^(\\.\\.?\\/.+)\\.js$': '$1',
    '^three/examples/jsm/.*$': '<rootDir>/__mocks__/three-jsm.js',
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
  transformIgnorePatterns: ['<rootDir>/node_modules/(?!three/examples/jsm/.*)'],
  testRegex: '\\.test.ts$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  verbose: true,
  collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
  clearMocks: true,
  extensionsToTreatAsEsm: ['.ts'],
};
