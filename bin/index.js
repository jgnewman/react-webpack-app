#!/usr/bin/env node

const prompts = require("prompts")
const fs = require("fs")
const path = require("path")

async function run() {
  const projectPath = path.resolve("./")
  let promptsAborted = false

  const captureAbort = ({ aborted }) => aborted && (promptsAborted = true)

  const mkdir = dir => {
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir)
    }
  }

  const writeFile = (file, content) => {
    fs.writeFileSync(file, content)
  }

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

  if (promptsAborted) {
    console.log("Process aborted.")
    return
  }

  let baseCommand = "npm install"
  let saveFlag = "--save"
  let devFlag = "--save-dev"

  if (userVals.useYarn) {
    baseCommand = "yarn add"
    saveFlag = ""
    devFlag = "--dev"
  }

  let stylePacks = "node-sass sass-loader"
  let styleLoader = "sass-loader"
  let styleExt = "scss"

  if (userVals.useStylus) {
    stylePacks = "stylus stylus-loader"
    styleLoader = "stylus-loader"
    styleExt = "styl"
  }

  let packageJSON = JSON.parse(fs.readFileSync(path.resolve(projectPath, "package.json")).toString())
  packageJSON.scripts = packageJSON.scripts || {}
  packageJSON.scripts.start = "NODE_ENV=development webpack-dev-server --mode development --progress --open"
  packageJSON.scripts.build = "NODE_ENV=production webpack --mode production"
  packageJSON = JSON.stringify(packageJSON, null, 2)

  let installCommand = `
  ${baseCommand} ${devFlag}
    webpack webpack-cli webpack-dev-server
    ${stylePacks} css-loader import-glob-loader mini-css-extract-plugin optimize-css-assets-webpack-plugin
    file-loader url-loader
    copy-webpack-plugin html-webpack-plugin
    @babel/core @babel/preset-env @babel/preset-react @babel/polyfill babel-loader
  && ${baseCommand} ${saveFlag} react react-dom redux react-redux
  `.trim().replace(/\n\s*/g, " ")

  const directories = [
    path.resolve(projectPath, "src"),
    path.resolve(projectPath, "src", "assets"),
    path.resolve(projectPath, "src", "styles"),
    path.resolve(projectPath, "src", "containers"),
    path.resolve(projectPath, "src", "components"),
  ]

  const files = [
    {
      file: path.resolve(projectPath, "package.json"),
      content: packageJSON
    },

    {
      file: path.resolve(projectPath, "webpack.config.js"),
      content: `
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
        test: /\.${styleExt}$/,
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
    },

    {
      file: path.resolve(projectPath, "src", "index.ejs"),
      content: `
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
    },

    {
      file: path.resolve(projectPath, "src", "styles", `styles.${styleExt}`),
      content: (userVals.useStylus ? `
body
  background: black
  color: white
  text-align: center
      ` : `
body {
  background: black;
  color: white;
  text-align: center;
}
      `).trim() + "\n"
    },

    {
      file: path.resolve(projectPath, "src", "index.js"),
      content: `
import "./styles/styles.${styleExt}"
import React from "react"
import ReactDOM from "react-dom"
import AppContainer from "./containers/AppContainer"

ReactDOM.render(
  <div className="my-app">
    <h1>My app is running!</h1>
  </div>
, document.querySelector("#app"))
      `.trim() + "\n"
    }
  ]

  directories.forEach(pathStr => mkdir(pathStr))
  files.forEach(obj => writeFile(obj.file, obj.content))

}


run()
