import { defineConfig } from 'cypress';
import {
  initPlugin,
  type Options,
} from '@frsource/cypress-plugin-visual-regression-diff/plugins';

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
      pluginVisualRegressionDiffConfig: {
        screenshotConfig: {
          blackout: [],
          capture: 'fullPage',
          disableTimersAndAnimations: true,
          timeout: 30000,
        },
      } satisfies Options,
    },
  },
});
