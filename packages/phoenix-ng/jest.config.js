const { pathsToModuleNameMapper } = require('ts-jest');
const { paths } = require('./tsconfig.json').compilerOptions;

const esModules = [
  '@angular',
  '@ngrx',
  'three/examples/jsm/',
  'jsroot',
  'jsroot/geom',
  '@angular/cdk',
  '@angular/material',
];

// eslint-disable-next-line no-undef
globalThis.ngJest = {
  skipNgcc: false,
  tsconfig: 'tsconfig.spec.json',
};

/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
module.exports = {
  preset: 'jest-preset-angular',
  testEnvironment: 'jsdom',

  // 🔑 CRITICAL: ensures CI uses your setup-jest.ts
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],

  moduleNameMapper: {
    ...pathsToModuleNameMapper(paths, { prefix: '<rootDir>' }),
    // Mock the Web Worker wrapper — import.meta.url cannot be parsed by Jest's
    // CommonJS runtime. Worker behaviour is not under test in unit tests.
    'phoenix-event-display/dist/workers/event-data-parser':
      '<rootDir>/projects/phoenix-ui-components/lib/test-helpers/event-data-parser-mock.ts',
    '(.*)/workers/event-data-parser':
      '<rootDir>/projects/phoenix-ui-components/lib/test-helpers/event-data-parser-mock.ts',
  },

  transformIgnorePatterns: [
    `/node_modules/(?!.*\\.m?js$|${esModules.join('|')})`,
  ],

  testRegex: '(/__test__/.*|(\\.|/)(component.test))\\.(j|t)sx?$',

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

  globals: {
    'ts-jest': {
      isolatedModules: true,
      astTransformers: {
        before: [
          {
            path: 'ts-jest-mock-import-meta',
            options: { metaObjectReplacement: { url: '' } },
          },
        ],
      },
    },
  },
};
