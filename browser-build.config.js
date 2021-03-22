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
      // All files with a '.ts' or '.tsx' extension will be handled by 'ts-loader'.
      {
        test: /\.(ts|tsx)$/,
        include: __dirname + '/src',
        use: [
          {
            loader: require.resolve('ts-loader'),
            options: {
              // disable type checker - we will use it in fork plugin
              transpileOnly: true,
            },
          },
        ],
      }
    ]
  },
  optimization: {
    minimize: true
  },
  plugins: [
  ]
};
