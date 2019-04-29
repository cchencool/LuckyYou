/**
 * File: /Users/guchenghao/LuckyYou/Dapp/webpack.config.js
 * Project: /Users/guchenghao/LuckyYou/Dapp
 * Created Date: Sunday, April 28th 2019, 3:13:23 pm
 * Author: Harold Gu
 * -----
 * Last Modified:
 * Modified By:
 * -----
 * Copyright (c) 2019 HKUST
 * ------------------------------------
 * Javascript will save your soul!
 */


const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: 'development',
  entry: "./src/index.js",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist")
  },
  plugins: [
    new CopyWebpackPlugin([
      { from: "./index.html", to: "index.html" },
      { from: "./components", to: "components"}]),
  ],
  devServer: { contentBase: path.join(__dirname, "dist"), compress: true },
};
