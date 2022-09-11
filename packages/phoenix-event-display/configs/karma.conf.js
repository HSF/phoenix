/* eslint-disable */
const path = require('path');

const resolveJSROOTPath = (filePath) =>
  path.dirname(require.resolve('jsroot')) + '/../' + filePath;

module.exports = function (config) {
  config.set({
    basePath: '../',
    // Timeout for browser disconnection error.
    pingTimeout: 15000,
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
    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox'],
      },
    },
    singleRun: true,
    colors: true,
    logLevel: config.LOG_INFO,
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
      exclude: ['node_modules'],
      bundlerOptions: {
        acornOptions: {
          ecmaVersion: 11,
        },
        resolve: {
          alias: {
            jsroot: resolveJSROOTPath('/modules/main.mjs'),
            'jsroot/core': resolveJSROOTPath('/modules/core.mjs'),
            'jsroot/draw': resolveJSROOTPath('/modules/draw.mjs'),
            'jsroot/io': resolveJSROOTPath('/modules/io.mjs'),
            'jsroot/tree': resolveJSROOTPath('/modules/tree.mjs'),
            'jsroot/colors': resolveJSROOTPath('/modules/base/colors.mjs'),
            'jsroot/hierarchy': resolveJSROOTPath(
              '/modules/gui/HierarchyPainter.mjs'
            ),
            'jsroot/latex': resolveJSROOTPath('/modules/base/latex.mjs'),
            'jsroot/geom': resolveJSROOTPath('/modules/geom/TGeoPainter.mjs'),
          },
        },
        transforms: [
          function (context, callback) {
            if (context.module === './core.mjs') {
              context.source = context.source.replace(
                'import.meta',
                'undefined'
              );
              return callback(undefined, true);
            }

            return callback(undefined, false);
          },
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
