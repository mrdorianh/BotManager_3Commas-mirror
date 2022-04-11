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
    scope: 'active',
  }).then(data => {
    // console.log(data);
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

const updateAllTakeProfit = async (tp) => {
  const deals = await showActiveDeals(false, true, '_api_').catch(err => console.log(err));
  console.log(deals);

  for (let i = 0; i < deals.length; i++) {
    try {
      var deal_id = deals[i].id;
      var new_take_profit_percentage = tp;
      // var new_take_profit_percentage = deal.take_profit;

      let data = await api.dealUpdateTp(deal_id, new_take_profit_percentage);
      if (typeof data === undefined) {
        console.error('data is undefined');
      }
      console.log(`${data.id}: Take Profit is now ${data.take_profit}% for ${data.pair}`);
    }
    catch (error) {
      console.error(error);
      throw error;
    }
  }
}


const updateTakeProfit = async (deal, tp) => {
  try {
    const deal_id = deal.id;
    const new_take_profit_percentage = tp;
    const data = await api.dealUpdateTp(deal_id, new_take_profit_percentage);
    if (typeof data === undefined) {
      console.error('data is undefined')
    }

    console.log(`${data.id}: TP changed from ${deal.take_profit} is now ${data.take_profit}% for ${data.pair}`);
    return data;
  }
  catch (error) {
    console.error(error);
    throw error;
  }
}
const updateTakeProfitByID = async (id, tp) => {
  try {
    const deal_id = id;
    const new_take_profit_percentage = tp;
    const data = await api.dealUpdateTp(deal_id, new_take_profit_percentage);
    if (typeof data === undefined) {
      console.error('data is undefined')
    }
    console.log(data);
    console.log(`${data.id}: TP changed to ${data.take_profit}% for ${data.pair}`);
    return data;
  }
  catch (error) {
    console.error(error);
    throw errpr;
  }
}

const didAttemptCloseIdArr = [];
const closeDealsWithFalseError = async () => {
  await showActiveDeals(false, true).then(deals => {
    deals.forEach(async element => {
      if (element.deal_has_error) {
        console.log(`\nFound deal with error: ${element.id} for pair ${element.pair}`)
        const currentProfit = parseFloat(element.actual_profit_percentage);
        if (currentProfit > 0.1) {
          console.log(`Attempting to close deal ${element.id} for pair ${element.pair}`);
          return await api.dealPanicSell(element.id).then(async result => {
            if (result.error === 'Forbidden') {
              console.log(`Recieved error while trying to close deal ${element.id} for pair ${element.pair}`);
              // return await api.dealCancel(element.id);
            }
            else {
              return result;
            }
          }).catch(err => {
            console.log(err);
          })
        }
        else {
          // console.log(`Cancelling deal ${element.id} for pair ${element.pair}`);
          // return await api.dealCancel(element.id);
          console.log(`Deal ${element.pair} has error but negative profit...waiting until profitable range.`)
        }
      }
    })
  }).catch(err => console.log(err))

}

const updateDealsBasedOnSO = async () => {
  return await showActiveDeals(false, true, '_api_').then(async deals => {
    const tp_array = ['0.5', '0.61', '0.74', '0.9', '1.0'];
    let deal;
    let profit_index;
    let isBusy = false;
    // console.log(deals);
    for (let i = 0; i < deals.length; i++) {
      try {
        deal = deals[i];

        while (isBusy) {
          let saidOnce = false;
          setTimeout(() => {
            if (!saidOnce) {
              console.log(`Deal ${deal.id} waiting in line`)
              saidOnce = true;
            }
          }, 1000);
        }
        isBusy = true;

        //check deal completed SO


        profit_index = deal.completed_safety_orders_count - 1;

        if (profit_index < 0) {
          // console.log('...moving to next deal')
          isBusy = false;
        }

        //check if values are already equal
        else if (deal.take_profit === tp_array[profit_index]) {
          // console.log(`...TP is already ${tp_array[profit_index]}%...moving to next deal`);
          isBusy = false;
          continue;
        }
        else {
          console.log(`\n${deal.id} has ${deal.completed_safety_orders_count} SO completed, and TP is ${deal.take_profit}%`);
          console.log(`...attempting to change to new TP: ${tp_array[profit_index]}%`)
          await updateTakeProfit(deal, tp_array[profit_index]);
          isBusy = false;
        }
      }
      catch (error) {
        isBusy = false;
        console.error(error);
      }
    }
  }).catch(err => { throw err });
}




let lastTemplateBot = null;
const changeShortBotSettings = async () => {
  return await api.getBots({
    limit: 150,
    strategy: 'short',
  }).then(async bots => {
    // const first = bots[0];
    const template = bots.filter((b) => b.name === "_template_")[0];
    const template_strategy_list = JSON.stringify(template.strategy_list);
    if (lastTemplateBot === null) {
      console.log("Last template is null.")
      lastTemplateBot = template;
    }
    if (template.base_order_volume === lastTemplateBot.base_order_volume) {
      console.log("No bot updates on template");
      return false;
    }
    // console.log(template,lastTemplateBot);
    lastTemplateBot = template;
    console.log("Template changed... updating short bots...");
    const requests = [];
    try {
      // console.log(bots[0]);

      bots.forEach(async element => {
        if (element.name != "_template_") {
          //cancelBotDeals

          const r = api.botCancelAllDeals(element.id).then(api.botUpdate({
            name: element.name,
            pairs: element.pairs,
            base_order_volume: template.base_order_volume,
            take_profit: template.take_profit,
            safety_order_volume: template.safety_order_volume,
            martingale_volume_coefficient: template.martingale_volume_coefficient,
            martingale_step_coefficient: template.martingale_step_coefficient,
            max_safety_orders: template.max_safety_orders,
            active_safety_orders_count: template.active_safety_orders_count,
            safety_order_step_percentage: template.safety_order_step_percentage,
            take_profit_type: element.take_profit_type,
            strategy_list: template_strategy_list,
            bot_id: element.id
          }))
          requests.push(r);

        }
      }
      );
      const result = await Promise.all(requests);
      console.log(`${result.length} short bots updated to mirror template`);
      return result;
    }
    catch (error) {
      throw error;
    }
  });
}

let totalDealsCancelledInSession = 0;
const cancelAllShortDealsPastFinalSO = async () => {
  const requests = [];
  return await showActiveDeals(false, true).then(async deals => {
    deals.forEach(d => {
      //  console.log(d);
      if (d.strategy === "short" && d.completed_safety_orders_count === d.max_safety_orders) {
        console.log(`${d.completed_safety_orders_count} of ${d.max_safety_orders} safety orders triggered for order #${d.id} on pair ${d.pair}`)
        requests.push(api.dealCancel(d.id));
      }
    })
    const result = await Promise.all(requests);
    console.log(`${result.length} deals canceled for hitting max SO`);
    totalDealsCancelledInSession += result.length;
    console.log(`${totalDealsCancelledInSession} total deals cancelled in session.`)
    return result;
  }).catch(err => { throw err });

}

const addFundsToAllLongDealsPastFinalSO = async (percentThresh = 0.1) => {
  const requests = [];
  return await showActiveDeals(false, true).then(async deals => {
    deals.forEach(d => {
      if (d.completed_safety_orders_count === d.max_safety_orders) {
        if (d.strategy === "long" && d.completed_manual_safety_orders_count === 0 && parseFloat(d.actual_profit_percentage) < (-10.0)) {
          requests.push(api.dealAddFunds({
            deal_id: d.id,
            quantity: parseFloat(d.bought_amount) * 2,
            is_market: true
          }).then(() => console.log(`Added ${parseFloat(d.bought_amount) * 2} to save order #${d.id} on pair ${d.pair}`)));
        }

        // console.log(`${d.completed_safety_orders_count} of ${d.max_safety_orders} safety orders triggered for order #${d.id} on pair ${d.pair}`)

      }
    })
    const result = await Promise.all(requests);
    console.log(`${result.length} deals have funds added for hitting -10% past max SO`);
    totalDealsCancelledInSession += result.length;
    console.log(`${totalDealsCancelledInSession} total deals have had funds added in session.`)
    return result;
  }).catch(err => { throw err });

}


const enableAllDisabledShortBots = async () => {
  return await api.getBots({
    limit: 150,
    strategy: 'short',
  }).then(async bots => {
    const requests = [];
    bots.forEach(b => {
      if (!b.is_enabled && b.name != '_template_') {
        //ENABLE Bot
        requests.push(api.botEnable(b.id));
      }

    })
    if (requests.length > 0) {
      console.log(`${requests.length} bot(s) are disabled likely after cancel. Attempting to enable them.`)
    }
    return await Promise.all(requests);

  }).catch(err => { throw err })
}

async function execute() {
  console.log(`\n \nBeginning deal update at: ${Date.now()}`);
  changeShortBotSettings()
    .then(enableAllDisabledShortBots)
    .then(updateDealsBasedOnSO)
    .then(closeDealsWithFalseError)
    .then(cancelAllShortDealsPastFinalSO)
    .then(addFundsToAllLongDealsPastFinalSO)
    .then(() => setTimeout(() => {
      execute();
    }, 6000))
    .catch(err => {
      console.log(err);
      setTimeout(() => {
        execute();
      }, 6000)
    });
}

async function fixFalseErrors() {
  await closeDealsWithFalseError().catch();
  setTimeout(async() => { return await fixFalseErrors() }, 5000);
//console.log('returning true')
return true;
}

module.exports = {
  execute: execute,
  fixFalseErrors: fixFalseErrors
} 