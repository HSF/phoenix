module.exports = function (config) {
  config.set({
    frameworks: ['jasmine', 'karma-typescript'],
    files: [
      { pattern: 'src/**/*.ts' }
    ],
    preprocessors: {
      '**/*.ts': ['karma-typescript']
    },
    reporters: ['dots', 'karma-typescript'],
    browsers: ['ChromeHeadless'],
    singleRun: true,
    karmaTypescriptConfig: {
      include: ['src'],
      compilerOptions: {
        module: 'commonjs',
        esModuleInterop: true
      },
      bundlerOptions: {
        transforms: [
          require('karma-typescript-es6-transform')()
        ]
      }
    }
  });
};
