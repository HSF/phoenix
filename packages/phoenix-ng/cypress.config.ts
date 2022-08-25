import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200/#/',
    fixturesFolder: false,
    defaultCommandTimeout: 60000,
    supportFile: './projects/phoenix-app/cypress/support/e2e.ts',
    screenshotsFolder: './projects/phoenix-app/cypress/screenshots',
    videosFolder: './projects/phoenix-app/cypress/videos',
    downloadsFolder: './projects/phoenix-app/cypress/downloads',
    specPattern: './projects/phoenix-app/cypress/e2e/**/*.cy.{js,ts}',
  },
});
