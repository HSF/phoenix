const { pathsToModuleNameMapper } = require('ts-jest');
const { paths } = require('./tsconfig.json').compilerOptions;

const esModules = ['@angular', '@ngrx', 'three/examples/jsm/', 'jsroot'];

// eslint-disable-next-line no-undef
globalThis.ngJest = {
  skipNgcc: false,
  tsconfig: 'tsconfig.spec.json',
};

/** @type {import('ts-jest/dist/types').JestConfigWithTsJest} */
module.exports = {
  preset: 'jest-preset-angular',
  moduleNameMapper: pathsToModuleNameMapper(paths, { prefix: '<rootDir>' }),
  setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
  transformIgnorePatterns: [
    `/node_modules/(?!.*\\.js$|${esModules.join('|')})`,
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
};
