const threeCommasAPI = require('3commas-api-node')
const api = new threeCommasAPI({
  apiKey: process.env['apiKey'],
  apiSecret: process.env['apiSecret'],
  // url: 'https://api.3commas.io' // this is optional in case of defining other endpoint
})

config = {
api: api,
refresh_rate: 3000, //in seconds
}

module.exports = config;
