#!/usr/bin/env node

const prompts = require("prompts")
const fs = require("fs")
const path = require("path")
const child_process = require("child_process")

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
    fs.writeFileSync(file, content, "utf8")
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
      file: path.resolve(projectPath, ".babelrc"),
      content: fs.readFileSync(path.resolve(__dirname, "./templates", "babelrc.json")).toString()
    },

    {
      file: path.resolve(projectPath, "package.json"),
      content: packageJSON
    },

    {
      file: path.resolve(projectPath, "webpack.config.js"),
      content: fs.readFileSync(path.resolve(__dirname, "./templates", "webpack.config.js")).toString()
    },

    {
      file: path.resolve(projectPath, "src", "index.ejs"),
      content: fs.readFileSync(path.resolve(__dirname, "./templates", "index.ejs")).toString()
    },

    {
      file: path.resolve(projectPath, "src", "styles", `styles.${styleExt}`),
      content: fs.readFileSync(path.resolve(__dirname, "./templates", `styles.${styleExt}`)).toString()
    },

    {
      file: path.resolve(projectPath, "src", "index.js"),
      content: fs.readFileSync(path.resolve(__dirname, "./templates", "index.js")).toString()
    }
  ]

  function buildIt() {
    console.log("\nBuilding directory structure...")
    directories.forEach(pathStr => {
      console.log(`- ${pathStr}`)
      mkdir(pathStr)
    })

    console.log("\nWriting files...")
    files.forEach(obj => {
      console.log(`- ${obj.file}`)
      writeFile(obj.file, obj.content)
    })

    console.log("\nInstalling packages...")
    const interval = setInterval(() => process.stdout.write("."), 300)
    const proc = child_process.exec(installCommand, (err, stdout, stderr) => {
      err && console.log(err)
      stdout && console.log(stdout)
      stderr && console.log(stderr)
      clearInterval(interval)
    })
    proc.on("close", () => console.log("Done."))
  }

  buildIt()
}


run()
