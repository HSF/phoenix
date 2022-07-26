/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
const { pathsToModuleNameMapper } = require('ts-jest');
const { paths } = require('./tsconfig.json').compilerOptions;
const esModules = [
  '@angular',
  '@ngrx',
  'three/examples/jsm/',
  '@rp3e11/ngx-slider/',
];

// eslint-disable-next-line no-undef
globalThis.ngJest = {
  skipNgcc: false,
  tsconfig: 'tsconfig.spec.json',
};

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  roots: ['projects'],
  preset: 'jest-preset-angular',
  resolver: '@nrwl/jest/plugins/resolver',
  globalSetup: 'jest-preset-angular/global-setup',
  moduleNameMapper: pathsToModuleNameMapper(paths, { prefix: '<rootDir>' }),
  moduleFileExtensions: ['ts', 'html', 'js', 'json', 'mjs'],
  transform: {
    '^.+\\.(ts|js|mjs|html|svg)$': 'jest-preset-angular',
  },
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  transformIgnorePatterns: [
    `/node_modules/(?!.*\\.js$|${esModules.join('|')})`,
  ],
  verbose: true,
  collectCoverageFrom: ['<rootDir>/projects/**/*.ts'],
};
