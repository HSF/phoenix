/* eslint-disable */
const path = require('path');

module.exports = {
  entry: './src/browser.ts',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        loader: 'esbuild-loader',
        exclude: /node_modules/,
        options: {
          target: 'es2020',
        },
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '...'],
  },
  output: {
    filename: `phoenix.min.js`,
    path: path.resolve(__dirname, '../dist/bundle'),
  },
  externals: {
    three: 'THREE',
  },
};
