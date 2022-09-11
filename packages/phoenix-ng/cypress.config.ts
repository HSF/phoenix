/* eslint-disable @typescript-eslint/no-var-requires */
import { defineConfig } from 'cypress';
const { initPlugin } = require('cypress-plugin-snapshots/plugin');

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      initPlugin(on, config);
      return config;
    },
    baseUrl: 'http://localhost:4200/#/',
    fixturesFolder: false,
    defaultCommandTimeout: 300000,
    supportFile: './projects/phoenix-app/cypress/support/e2e.ts',
    screenshotsFolder: './projects/phoenix-app/cypress/screenshots',
    videosFolder: './projects/phoenix-app/cypress/videos',
    downloadsFolder: './projects/phoenix-app/cypress/downloads',
    specPattern: './projects/phoenix-app/cypress/e2e/**/*.test.{js,ts}',
    excludeSpecPattern: ['**/__snapshots__/*', '**/__image_snapshots__/*'],
    env: {
      'cypress-plugin-snapshots': {
        screenshotConfig: {
          // See https://docs.cypress.io/api/commands/screenshot.html#Arguments
          blackout: [],
          capture: 'fullPage',
          clip: null,
          disableTimersAndAnimations: true,
          log: true,
          scale: false,
          timeout: 30000,
        },
      },
    },
  },
});
