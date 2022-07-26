/* eslint-disable */
// Karma configuration file, see link for more information
// https://karma-runner.github.io/1.0/config/configuration-file.html

module.exports = function (config) {
  config.set({
    basePath: '',
    // Timeout for browser disconnection error.
    pingTimeout: 15000,
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma'),
    ],
    client: {
      clearContext: false, // leave Jasmine Spec Runner output visible in browser
    },
    files: [
      {
        pattern: './lib/assets/**',
        watched: false,
        included: false,
        served: true,
      },
    ],
    proxies: {
      '/assets/': '/base/lib/assets/',
    },
    reporters: ['progress', 'coverage'],
    coverageReporter: {
      dir: require('path').join(
        __dirname,
        '../../coverage/phoenix-ui-components'
      ),
      subdir: '.',
      reporters: [{ type: 'lcov' }, { type: 'text-summary' }],
    },
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox'],
      },
    },
    singleRun: false,
    restartOnFileChange: true,
  });
};
