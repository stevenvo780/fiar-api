const webpack = require('webpack');
const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: ['./src/main.ts'],
  target: 'node',
  externals: [nodeExternals()],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'main.js',
    libraryTarget: 'commonjs2'
  },
  optimization: {
    minimize: false
  },
  resolve: {
    extensions: ['.ts', '.js'],
    plugins: [new TsconfigPathsPlugin()],
    modules: ['node_modules', path.resolve(__dirname, 'src')]
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.build.json',
              transpileOnly: false
            }
          }
        ],
        exclude: /node_modules/
      }
    ]
  },
  plugins: [
    new webpack.IgnorePlugin({
      checkResource(resource) {
        const lazyImports = [
          '@nestjs/microservices',
          '@nestjs/platform-express',
          'cache-manager',
          'class-validator',
          'class-transformer'
        ];
        if (!lazyImports.includes(resource)) {
          return false;
        }
        try {
          require.resolve(resource);
        } catch (err) {
          return true;
        }
        return false;
      }
    })
  ]
};
