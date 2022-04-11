/**
 * TIME BOT
 * If deal start time is more than x minutes, close deal.
 */
const threeCommasAPI = require('3commas-api-node')

const api = new threeCommasAPI({
  apiKey: process.env['apiKey'],
  apiSecret: process.env['apiSecret'],
  // url: 'https://api.3commas.io' // this is optional in case of defining other endpoint
})

const showActiveDeals = async (toConsole = false, shortConsole = true, nameContains = "") => {
  let readData;
  return await api.getDeals({
    limit: 200,
    scope: 'active'
  }).then(data => {
    // console.log(data.length);
    if (data.error === 'unknown_error') {
      throw `Error getting deals: \n${JSON.stringify(data)}`;
    }
    readData = data;
    let sorted_data;
    if (nameContains === "") {
      sorted_data = data;
    }
    else {
      sorted_data = data.filter((e) => e.bot_name.includes(nameContains));
    }
    if (toConsole) {
      if (shortConsole) {
        sorted_data.forEach(element => console.log(`${element.id} for pair ${element.pair}`));
      }
      else { console.log(sorted_data) }
    }
    return sorted_data;
  }).catch(err => {
    console.log(readData);
    throw err;
  })
}

function millisToMinutes(millis) {
  return Math.floor(millis / 60000);
}

const getdiffInMinutes = (date1, date2) => {
  const diffTime = Math.abs(date2 - date1);
  return millisToMinutes(diffTime);

}
const execute = async () => {
  //Find deals with bot ids containing "_v3_"
  return await showActiveDeals(false, false, "_v3_").then(async deals => {
    // console.log(deals);
    if(deals.length > 0){
    deals.forEach(async d => {
      const d1 = new Date(d.created_at);
      const d2 = new Date(Date.now());
      if (d.bot_name.includes("_T3_")) {
        // If deal start time is more than x minutes
        if (getdiffInMinutes(d1, d2) >= 3) {
          await api.dealPanicSell(d.id).then(rd => console.log(`deal pair ${rd.pair} closed for _T3_`));
        }
      }
      else if (d.bot_name.includes("_T5_")) {
        // If deal start time is more than x minutes
        if (getdiffInMinutes(d1, d2) >= 5) {
          console.log("_T5_ attributed deal is older than 5 minutes. Closing deal...")
          await api.dealPanicSell(d.id).then(rd => console.log(`deal pair ${rd.pair} closed for _T5_`))
        }
      }
      else if (d.bot_name.includes("_T10_")) {
        // If deal start time is more than x minutes
        if (getdiffInMinutes(d1, d2) >= 10) {
          await api.dealPanicSell(d.id).then(rd => console.log(`deal pair ${rd.pair} closed for _T10_`));
        }
      }
      else if (d.bot_name.includes("_T15_")) {
        // If deal start time is more than x minutes
        if (getdiffInMinutes(d1, d2) >= 15) {
          await api.dealPanicSell(d.id).then(rd => console.log(`deal pair ${rd.pair} closed for _T15_`));
        }
      }
      else if (d.bot_name.includes("_T20_")) {
        // If deal start time is more than x minutes
        if (getdiffInMinutes(d1, d2) >= 20) {
          await api.dealPanicSell(d.id).then(rd => console.log(`deal pair ${rd.pair} closed for _T20_`));
        }
      }
    })}
    else{
      
      // console.log("No deals open for v3");
    }
    return await setTimeout(async () => {
      return await execute();
    },5000);
  }).catch(err => {
    console.log(err);
    return setTimeout(async () => {
      return await execute();
    },5000);
    
  })
} 
module.exports = {
  execute: execute
} 