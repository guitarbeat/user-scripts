const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');
const { BannerPlugin } = webpack;

// Read package.json for metadata
const pkg = require('./package.json');

// Define the userscript metadata block
const userscriptBanner = `
// ==UserScript==
// @name         Canvas Grading Tools
// @namespace    http://tampermonkey.net/
// @version      ${pkg.version}
// @description  ${pkg.description}
// @author       ${pkg.author || 'User'}
// @match        https://*.instructure.com/courses/*/gradebook/speed_grader*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=instructure.com
// @grant        none
// ==/UserScript==
`.trim();

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === 'development';

  return {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'canvas-grading-tools.user.js',
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', { 
                  targets: '> 0.25%, not dead',
                  useBuiltIns: 'usage',
                  corejs: 3
                }]
              ]
            }
          }
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        }
      ]
    },
    optimization: {
      minimize: !isDevelopment,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            format: {
              comments: /==\/?UserScript==|@|==\/?UserStyle==/i,
            },
          },
          extractComments: false,
        }),
      ],
    },
    plugins: [
      new BannerPlugin({
        banner: userscriptBanner,
        raw: true,
        entryOnly: true
      }),
      new webpack.DefinePlugin({
        'process.env.VERSION': JSON.stringify(pkg.version),
        'process.env.NODE_ENV': JSON.stringify(argv.mode)
      })
    ],
    devtool: isDevelopment ? 'inline-source-map' : false,
    performance: {
      hints: isDevelopment ? false : 'warning'
    },
    watchOptions: {
      ignored: /node_modules/
    }
  };
}; 