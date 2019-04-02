module.exports = {
  entry: ['./src/index.ts'],
  output: {
    filename: 'main.js',
    path: __dirname + '/browser',
    library: 'D3Util'
  },
  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: ['.ts', '.js', '.json']
  },
  module: {
    rules: [
      // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
      {
        test: /\.ts$/,
        include: /src/,
        loader: 'awesome-typescript-loader'
      },
    ]
  },
  optimization: {
    minimize: true
  },
  plugins: [
  ]
};
