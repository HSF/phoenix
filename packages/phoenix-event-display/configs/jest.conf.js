/* eslint-disable no-undef */

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  rootDir: '../',
  roots: ['<rootDir>/src/tests'],
  preset: 'ts-jest/presets/js-with-ts-legacy',
  transform: {
    '^.+\\.m?[tj]s$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          rootDir: null,
          allowJs: true,
        },
      },
    ],
  },
  moduleNameMapper: {
    'jsroot/geom': '<rootDir>../../node_modules/jsroot/',
    'jsroot/io': '<rootDir>../../node_modules/jsroot/',
  },
  transformIgnorePatterns: [
    '<rootDir>/node_modules/(?!three/examples/jsm)',
    '<rootDir>/node_modules/(?!jsroot)',
  ],
  testRegex: '\\.test.ts$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  verbose: true,
  collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
  clearMocks: true,
};
