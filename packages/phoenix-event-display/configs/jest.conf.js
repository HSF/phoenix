/* eslint-disable no-undef */

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  rootDir: '../',
  globals: {
    'ts-jest': {
      tsconfig: {
        rootDir: null,
        allowJs: true,
      },
    },
  },
  roots: ['<rootDir>/src/tests'],
  moduleNameMapper: {
    'jsroot/geom': '<rootDir>../../../phoenix/node_modules/jsroot/',
    'jsroot/io': '<rootDir>../../../phoenix/node_modules/jsroot/',
  },
  preset: 'ts-jest/presets/js-with-ts',
  transformIgnorePatterns: ['/node_modules/(?!three/examples/jsm/.+\\.js)'],
  testRegex: '(/__test__/.*|(\\.|/)(test|spec))\\.(j|t)sx?$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  verbose: true,
  collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
  clearMocks: true,
};
