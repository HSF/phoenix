module.exports = function (config) {
  config.set({
    basePath: '../',
    frameworks: ['jasmine', 'karma-typescript'],
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
    singleRun: true,
    karmaTypescriptConfig: {
      include: ['src'],
      reports: {
        html: {
          directory: 'coverage',
          subdirectory: '.',
        },
        lcovonly: {
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
        transforms: [require('karma-typescript-es6-transform')()],
      },
    },
  });
};
