/* eslint-disable no-undef */
// eslint-disable-next-line @typescript-eslint/no-var-requires
const jestCfg = require('./jest.config');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { defaults } = require('jest-preset-angular/presets');

/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  ...jestCfg,
  globals: {
    'ts-jest': {
      ...defaults.globals['ts-jest'],
      isolatedModules: true,
    },
  },
};
