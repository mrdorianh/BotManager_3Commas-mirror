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

let lastCancelTime = Date.now;
let dealsOpen = 0;
async function execute(delay=10000) {

  const work = async () => {return await showActiveDeals(false, false, "_v2_").then(deals => {
   if(deals.length != dealsOpen) {
dealsOpen = deals.length;
console.log(`${dealsOpen} deals open`);}
    let shouldStop = false;
    deals.forEach(async d => {
      if (shouldStop) {
        return;
      }
      //if all SO are completed and profit is -2.5%
      if (d.completed_safety_orders_count === d.max_safety_orders) {
        const currentProfit = parseFloat(d.actual_profit_percentage);
        if (currentProfit < (-5.1)) {
          console.log(`Attempting to close deal ${d.id} for pair ${d.pair}`);
          // close deal and disable bot for 20 min.
          const cancelTime = Date.now;
          //if two closed in the last hour, close all deals and wait 20 min.
          if (cancelTime - lastCancelTime < (3.6 * 10 ^ 3)) {
            shouldStop = true;
            lastCancelTime = Date.now;
            console.log("Attempting to close all deals!")
            return await api.botPaniceSellAllDeals(d.bot_id).then(async () => {
              return await api.botDisable(d.bot_id).then(async () => setTimeout(async () => {
                return await api.botEnable(d.bot_id);
              }, (1000 * 60 * 20))).catch(err => {
                throw err;
              })
            });
          }
          else{
          
          lastCancelTime = Date.now;
          return await api.dealPanicSell(d.id).then(async result => {
            if (result.error === 'Forbidden') {
              console.log(`Recieved error while trying to close deal ${d.id} for pair ${d.pair}...Cancelling.`);
api.dealCancel(d.id);
            }
          
              await api.botDisable(d.bot_id).then(async () => {
console.log("Disabled bot for 20 min...")
setTimeout(async () => {
               await api.botEnable(d.bot_id).then(()=>{console.log("Enabled bot after 20 min wait");
              })}, (1000 * 60 * 20))}).catch(err => {
                console.log(err);
              })
              return result;
            
          }).then(execute).catch(err => {
            throw err;
        
          })
        }
      }}
    })
  }).then(()=> {execute();
                 return true;
                 }).catch(err=>{console.log(err);
setTimeout(execute,10000);
})
}

  setTimeout(work,delay)
}

module.exports = {
  execute: execute
} 