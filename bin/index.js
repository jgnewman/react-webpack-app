#!/usr/bin/env node

const prompts = require("prompts")
const fs = require("fs")
const path = require("path")

async function run() {
  let promptsAborted = false

  console.log(__dirname, path.resolve("./"))

  const captureAbort = ({ aborted }) => aborted && (wasAborted = true)

  const userVals = await prompts([
    {
      type: "confirm",
      name: "useYarn",
      message: "Use yarn instead of npm?",
      initial: false,
      onState: captureAbort
    },
    {
      type: "confirm",
      name: "useStylus",
      message: "Use stylus instead of scss?",
      initial: false,
      onState: captureAbort
    },
  ]);

  console.log(userVals); // => { value: 24 }

  if (wasAborted) {
    console.log("Process aborted.")
    return
  }

  let command = "npm install"
  let saveFlag = "--save"
  let devFlag = "--save-dev"

  if (userVals.useYarn) {
    command = "yarn add"
    saveFlag = ""
    devFlag = "--dev"
  }

  let stylePacks = " node-sass sass-loader "
  let styleLoader = "sass-loader"

  if (userVals.useStylus) {
    stylePacks = " stylus stylus-loader "
    styleLoader = "stylus-loader"
  }

  const webpackConfig = `
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const config = {
  entry: "./src/index.js",

  output: {
    filename: "./bundle.js"
  },

  resolve: {
    extensions: ['.js', '.jsx']
  },

  devServer: {
    historyApiFallback: true
  },

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
        test: /\.scss$/,
        use: [
          { loader: MiniCssExtractPlugin.loader },
          { loader: "css-loader", options: {sourceMap: true} },
          { loader: "${styleLoader}", },
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
  `.trim() + "\n"

  const html = `
<% const vars = htmlWebpackPlugin.options.vars %>
<% const isDev = process.env.NODE_ENV === "development" %>
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1"/ >
  <title>My React App</title>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.0/normalize.min.css" rel="stylesheet" />
  <% if (!isDev) { %>
    <link type="text/css" rel="stylesheet" href="./styles.css" />
  <% } %>
</head>
<body>
  <div id="app"></div>
</body>
</html>
  `.trim() + "\n"

}

run()
