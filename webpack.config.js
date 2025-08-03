// webpack.config.js
const webpack = require('webpack');
const path = require('path');
const { version } = require('./package.json');

const build_id = Math.random().toString(36).substring(2, 15);
const build_date = new Date().toISOString().split('T')[0];;

module.exports = {
  entry: './src/index.js',
  output: {
    filename: `bundle_${build_id}.js`,
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.html$/i,
        type: 'asset/source', // Treat HTML as a string
      },
      {
        test: /\.css$/i,
        type: 'asset/source', // Treat CSS as a string
      }
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.BUILD_ID': JSON.stringify(build_id), // <- Inject as global constant
      'process.env.BUILD_DATE': JSON.stringify(build_date), // <- Inject build date
      'process.env.VERSION': JSON.stringify(version), // <- Inject version
    }),
    {
      apply: (compiler) => {
        compiler.hooks.done.tap('PostBuildPlugin', (stats) => {
          console.log('\x1b[32m%s\x1b[0m', '✅ Build complete!');
          console.log('Build ID:', build_id);
          console.log('Build Date:', build_date);
          console.log('Version:', version);
          console.log(`Output File: bundle_${build_id}.js`);
        });
      }
    }
  ],
  mode: 'production', // or 'production'
};
