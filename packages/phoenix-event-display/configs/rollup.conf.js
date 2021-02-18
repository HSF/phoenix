
export default {
  input: './dist/index.js',
  // https://github.com/rollup/rollup/wiki/Troubleshooting#this-is-undefined
  context: 'this',
  output: [
    {
      file: 'dist/umd/phoenix.js',
      name: 'PhoenixEventDisplay',
      format: 'umd',
    }
  ],
}