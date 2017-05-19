'use strict';
var webpack = require('webpack');

var config = {
  context: __dirname + '/src', // `__dirname` is root of project and `src` is source
  entry: {
    app: './app.js',
  },
  output: {
    path: __dirname + '/dist', // `dist` is the destination
    filename: 'osmaps.bundle.js',
    publicPath: "/assets/",
  },
  module: {
      rules: [
        {
            test: /\.js$/, //Check for all js files
            loader: 'babel-loader',
            query: {
                presets: [ "babel-preset-es2015" ].map(require.resolve)
            }
        },
        {
            test: /\.(sass|scss)$/, //Check for sass or scss file names
            use: [
            'style-loader',
            'css-loader',
            'sass-loader',
            ]
        },
        {
            test: /\.docx$/,
            loader: "file-loader"
        },
        { 
            test: /\.json$/, 
            loader: "json-loader"  //JSON loader
        }
    ]
  },
  plugins: [
    //new UglifyJSPlugin()
  ],
  devServer: {
    open: true,                                 // to open the local server in browser
    contentBase: __dirname + '/src',
  },
  devtool: "eval-source-map" // Default development sourcemap
};

// Check if build is running in production mode, then change the sourcemap type
if (process.env.NODE_ENV === "production") {
  config.devtool = "source-map";
  // Can do more here
  // JSUglify plugin
  // Offline plugin
  // Bundle styles seperatly using plugins etc,
}

module.exports = config;