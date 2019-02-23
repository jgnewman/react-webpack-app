const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const config = {
  entry: "./src/index.js",
  output: { filename: "./bundle.js" },
  resolve: { extensions: ['.js', '.jsx'] },
  devServer: { historyApiFallback: true },
  plugins: [
    new CopyWebpackPlugin([{ from: "./src/assets", to: "assets" }]),
    new MiniCssExtractPlugin({ filename: "styles.css" }),
    new HtmlWebpackPlugin({
      template: "./src/index.ejs",
      filename: "./index.html",
      vars: {}
    })
  ],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: { loader: "babel-loader" }
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        use: { loader: "url-loader", options: {limit: 10000} }
      },
      {
        test: /\.{{styleExt}}$/,
        use: [
          { loader: MiniCssExtractPlugin.loader },
          { loader: "css-loader", options: {sourceMap: true} },
          { loader: "{{styleLoader}}", },
          { loader: "import-glob-loader" }
        ]
      }
    ]
  }
}
if (process.env.NODE_ENV === "development") {
  config.devtool = "source-map"
}
if (process.env.NODE_ENV === "production") {
  config.plugins.push(new OptimizeCssAssetsPlugin())
}
module.exports = config
