/* eslint-disable no-undef */
const esModules = [
  '@angular',
  '@ngrx',
  'three/examples/jsm/',
  '@rp3e11/ngx-slider/',
  'jsroot',
];

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
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    'jsroot/geom': '<rootDir>../../node_modules/jsroot/',
    'jsroot/io': '<rootDir>../../node_modules/jsroot/',
  },
  moduleFileExtensions: ['ts', 'html', 'js', 'json', 'mjs'],
  transform: {
    '^.+\\.(ts|js|mjs|html|svg)$': 'jest-preset-angular',
  },
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  testRegex: '(/__test__/.*|(\\.|/)(component.test))\\.(j|t)sx?$',
  transformIgnorePatterns: [
    `/node_modules/(?!.*\\.js$|${esModules.join('|')})`,
  ],
  verbose: true,
  collectCoverageFrom: [
    '<rootDir>/projects/**/*.ts',
    '!<rootDir>/projects/phoenix-app/src/main.ts',
    '!<rootDir>/projects/phoenix-app/src/polyfills.ts',
    '!<rootDir>/projects/phoenix-app/src/zone-flags.ts',
    '!<rootDir>/projects/phoenix-app/src/(environments/**/*.ts|test.ts)',
    '!<rootDir>/projects/phoenix-ui-components/lib/(environments/**/*.ts|test.ts)',
    '!<rootDir>/projects/phoenix-app/cypress/**/*.ts',
  ],
};
