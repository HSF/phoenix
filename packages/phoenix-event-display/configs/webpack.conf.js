const path = require('path');
const packageJSON = require('../package.json');

module.exports = {
  entry: './src/browser.ts',
  mode: 'production',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: `phoenix-${packageJSON.version}.min.js`,
    path: path.resolve(__dirname, '../dist/bundle'),
  },
};
