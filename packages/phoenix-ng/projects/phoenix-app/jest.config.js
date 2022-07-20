/* eslint-disable no-undef */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { pathsToModuleNameMapper } = require('ts-jest');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { paths } = require('./tsconfig.json').compilerOptions;

// eslint-disable-next-line no-undef
globalThis.ngJest = {
  skipNgcc: false,
  tsconfig: 'tsconfig.spec.json',
};

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'jest-preset-angular',
  coverageReporters: ['html'],
  resolver: '@nrwl/jest/plugins/resolver',
  moduleFileExtensions: ['ts', 'js', 'html', 'json'],
  transformIgnorePatterns: ['./node_modules/(?!three/examples/jsm/.+\\.js)'],
  moduleNameMapper: pathsToModuleNameMapper(paths, { prefix: '<rootDir>' }),
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  transform: {
    '^.+\\.(ts|js|html)$': 'jest-preset-angular',
  },
  globals: {
    'ts-jest': {
      tsconfig: {
        rootDir: null,
        allowJs: true,
      },
    },
  },
  testMatch: ['**/+(*.)+(spec|test).+(ts|js)?(x)'],
  verbose: true,
  testEnvironment: 'jsdom',
};
