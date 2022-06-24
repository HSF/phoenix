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
  preset: 'ts-jest/presets/js-with-ts',
  transformIgnorePatterns: ['/node_modules/(?!three/examples/jsm/.+\\.js)'],
  testRegex: '(/__test__/.*|(\\.|/)(test|spec))\\.(j|t)sx?$',
  moduleFileExtensions: ['ts', 'js', 'json'],
  verbose: true,
  collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
  clearMocks: true,
};
