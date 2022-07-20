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
  globalSetup: 'jest-preset-angular/global-setup',
  moduleNameMapper: pathsToModuleNameMapper(paths, { prefix: '<rootDir>' }),
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  verbose: true,
};
