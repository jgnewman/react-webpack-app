#!/usr/bin/env node

const prompts = require("prompts")

async function run() {

  const userVals = await prompts([
    {
      type: "confirm",
      name: "useYarn",
      message: "Use yarn instead of npm?",
      initial: false,
    },
    {
      type: "confirm",
      name: "useStylus",
      message: "Use stylus instead of scss?",
      initial: false,
    },
  ]);

  console.log(userVals); // => { value: 24 }

}

run()
