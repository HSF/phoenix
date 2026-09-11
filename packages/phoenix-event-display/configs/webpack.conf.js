/* eslint-disable */
const path = require('path');

module.exports = {
  entry: './src/browser.ts',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'esbuild-loader',
        exclude: /node_modules/,
        options: {
          loader: 'ts',
          target: 'es2020',
        },
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: `phoenix.min.js`,
    path: path.resolve(__dirname, '../dist/bundle'),
  },
  externals: [
    { three: 'THREE' },
    // jsroot reaches for Node-only modules behind `isNodeJs()` guards, which are
    // unreachable in the browser but still resolved by webpack at build time.
    // The package's `browser` field does not cover this, as it only applies when
    // webpack resolves this package as a dependency, not when building from
    // inside it.
    ({ request }, callback) => {
      if (request === '@resvg/resvg-js' || /^node:/.test(request)) {
        return callback(null, 'var undefined');
      }
      callback();
    },
  ],
};
