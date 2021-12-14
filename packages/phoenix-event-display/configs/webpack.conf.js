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
          target: 'es2015',
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
  externals: {
    three: 'THREE',
  },
};
