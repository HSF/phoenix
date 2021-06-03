module.exports = function (config) {
  config.set({
    basePath: '../',
    // Timeout for browser disconnection error.
    pingTimeout: 15000,
    frameworks: ['jasmine', 'karma-typescript'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-typescript'),
    ],
    files: [
      { pattern: 'src/**/*.ts' },
      {
        pattern: 'src/tests/files/**/*',
        watched: false,
        included: false,
        served: true,
      },
    ],
    exclude: ['src/browser.ts'],
    proxies: {
      '/assets/': '/base/src/tests/files/',
    },
    preprocessors: {
      '**/*.ts': ['karma-typescript'],
    },
    reporters: ['dots', 'karma-typescript'],
    browsers: ['ChromeHeadless'],
    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox'],
      },
    },
    singleRun: false,
    colors: true,
    logLevel: config.LOG_INFO,
    port: 9876,
    karmaTypescriptConfig: {
      include: ['src'],
      reports: {
        lcov: {
          directory: 'coverage',
          subdirectory: '.',
        },
      },
      compilerOptions: {
        module: 'commonjs',
        esModuleInterop: true,
        resolveJsonModule: true,
      },
      bundlerOptions: {
        transforms: [
          require('karma-typescript-es6-transform')({
            plugins: [
              [
                '@babel/plugin-transform-runtime',
                {
                  regenerator: true,
                },
              ],
            ],
          }),
        ],
      },
    },
  });
};
