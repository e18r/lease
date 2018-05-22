const CleanWebpackPlugin = require("clean-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  entry: "./app/index.js",
  devtool: "inline-source-map",
  plugins: [
    new CleanWebpackPlugin("build", {exclude: ["contracts"]}),
    new HtmlWebpackPlugin({title: "Lease Contract"})
  ],
  output: {
    filename: "bundle.js",
    path: __dirname + "/build"
  },
  mode: "development",
}
