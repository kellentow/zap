// webpack.config.js
const webpack = require('webpack');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: __dirname + '/dist',
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: `
/*!
 * I am not responsible for anything said in this app.
 * Press enter to send a message
 * 
 * Author: Kellen
 * Built: ${new Date().toISOString()}
 * Build ID: ${Math.random().toString(36).substring(2, 15)}
 * This code uses the MPL-2.0 license.
 * You can find the license here: https://www.mozilla.org/en-US/MPL/2.0/
 * 
 * This code was generated and packed by Webpack.
 * You can find the source code at https://github.com/kellentow/zap
 */
      `.trim(),
      raw: true, // Set to true to preserve formatting and comment syntax
    }),
  ],
};
