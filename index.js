
/**
 * Required External Modules
 */
const threeCommasAPI = require('3commas-api-node')
const api = new threeCommasAPI({
  apiKey: process.env['apiKey'],
  apiSecret: process.env['apiSecret'],
  // url: 'https://api.3commas.io' // this is optional in case of defining other endpoint
})

const mirrorBot = require("./scripts/mirror-bot.js")
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser")
const cors = require("cors");

/**
  * Pulls latest settings
  * returns current mirror settings as object
  */

async function main() {
  async function syncMirrorSettings() {
    currentMirrorSettings = await mirrorBot.getCurrentSettings();
    return currentMirrorSettings;
  }
  
  /**
   * App Variables
   */
  const app = express();
  const port = process.env.PORT || "8000";
  mirrorBot.init(api);
  let currentMirrorSettings = null;
  await syncMirrorSettings();
  console.log("Current Settings");
  console.log(currentMirrorSettings);
  
  /**
   *  App Configuration
   */
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.set("views", path.join(__dirname, "views"));
  app.set("view engine", "pug");
  app.use(express.static(path.join(__dirname, "public")));
  app.use(cors());

  /**
   * Routes Definitions
   */
  app.get('/', function(req, res) {
  
   
    res.json(currentMirrorSettings);
  });

  app.get('/api', function(req, res) {
    res.json(currentMirrorSettings);
  });

  app.post("/mirror", async (req, res) => {
    inputMirrorSettings = req.body;
    console.log("POST to /mirror received")
    console.log(inputMirrorSettings);
    let merged = Object.assign(currentMirrorSettings, inputMirrorSettings);
    console.log(merged);
    mirrorBot.mirror(merged)
      .then(syncMirrorSettings)
      .then(() => res.json(currentMirrorSettings))

  });

  /**
   * Server Activation
   */

  // Start express on the defined port
  app.listen(port, () => console.log(`🚀 Server running on port ${port}`))
}

main().catch(console.log);

