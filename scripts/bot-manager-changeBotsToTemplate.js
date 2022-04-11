const threeCommasAPI = require('3commas-api-node')
const api = new threeCommasAPI({
  apiKey: process.env['apiKey'],
  apiSecret: process.env['apiSecret'],
  // url: 'https://api.3commas.io' // this is optional in case of defining other endpoint
})

settings = {
// api: api,
refresh_rate: 3000, //in seconds
}

var path = require('path');
// var settings = require('./scripts/settings.js');
var scriptName = path.basename(__filename, '.js');
// const api = settings.api;

let lastTemplateBot = null;
const changeBotsToTemplate = async () => {
  if (!api) {
    throw "No API found";
  }
  return await api.getBots({
    limit: 150,
    strategy: 'long',
  }).then(async bots => {
    // console.log(bots);
    const template = bots.filter((b) => b.name === "_template_")[0];
    if (!template) {
      console.log("There is no template bot named _template_")
      return false;
    }
    
    if (lastTemplateBot === null) {
      // console.log("Last template is null.")
      lastTemplateBot = template;
    }
    //Check if anything was changed
    if (template.updated_at == lastTemplateBot.updated_at) {
      // console.log("No bot updates on template");
      lastTemplateBot = template;
      return false;
    }
    // console.log(template,lastTemplateBot);
    lastTemplateBot = template;
    console.log("Template changed... updating bots...");
    const requests = [];
    const template_strategy_list = JSON.stringify(template.strategy_list);
    try {
      // console.log(bots[0]);

      bots.forEach(async element => {
        if (element.name != "_template_") {

          // element for keeping same settings
          //template for updating
          const r = api.botUpdate({
            //Required by API
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
            bot_id: element.id,
            //OPTIONAL
            max_active_deals: template.max_active_deals,
            trailing_enabled: template.trailing_enabled,
            tsl_enabled: template.tsl_enabled, //bitmex only
            deal_start_delay_seconds: template.deal_start_delay_seconds,
            stop_loss_timeout_enabled: template.stop_loss_timeout_enabled,
            stop_loss_timeout_in_seconds: template.stop_loss_timeout_in_seconds,
            disable_after_deals_count: template.disable_after_deals_count,
            stop_loss_percentage: template.stop_loss_percentage,
            cooldown: template.cooldown,
            btc_price_limit: template.btc_price_limit,
            min_volume_btc_24h: template.min_volume_btc_24h,
            profit_currency: template.profit_currency,
            min_price: template.min_price,
            max_price: template.max_price,
            stop_loss_type: template.stop_loss_type,
            trailing_deviation: template.trailing_deviation,
            start_order_type: template.start_order_type
          })
          requests.push(r);

        }
      }
      );
      const result = await Promise.all(requests);
      console.log(`${result.length} bots updated to mirror template`);
      return result;
    }
    catch (error) {
      throw error;
    }
  }).catch(err => console.log(err));
}
const execute = async () => {
  await changeBotsToTemplate().catch(err => {
    console.log(err);
    if (err === "No API found") {
      process.exit();
    }
  })
  setTimeout(() => {
    execute();
  }, settings.refresh_rate)
}
console.log(`Beginning poll for ${scriptName} at ${settings.refresh_rate} ms`);
// execute();

const mirror = async (mirrorSettings = {}) => {
  if (!api) {
    throw "No API found";
  }
  return await api.getBots({
    limit: 150,
    strategy: 'long',
  }).then(async bots => {
    // console.log(bots);
   
    const requests = [];
    try {
      // console.log(bots[0]);

      bots.forEach(async element => {
        if (element.name != "_template_") {

          // element for keeping same settings
          //template for updating //NEED TO CHANGE TO ELEMENT
          template = element
          const r = api.botUpdate({
            //Required by API
            name: element.name,
            pairs: element.pairs,
            base_order_volume: template.base_order_volume,
            //test
            take_profit: mirrorSettings.take_profit,
            safety_order_volume: template.safety_order_volume,
            martingale_volume_coefficient: template.martingale_volume_coefficient,
            martingale_step_coefficient: template.martingale_step_coefficient,
            max_safety_orders: template.max_safety_orders,
            active_safety_orders_count: template.active_safety_orders_count,
            safety_order_step_percentage: template.safety_order_step_percentage,
            take_profit_type: element.take_profit_type,
            strategy_list: template_strategy_list,
            bot_id: element.id,
            //OPTIONAL
            max_active_deals: template.max_active_deals,
            trailing_enabled: template.trailing_enabled,
            tsl_enabled: template.tsl_enabled, //bitmex only
            deal_start_delay_seconds: template.deal_start_delay_seconds,
            stop_loss_timeout_enabled: template.stop_loss_timeout_enabled,
            stop_loss_timeout_in_seconds: template.stop_loss_timeout_in_seconds,
            disable_after_deals_count: template.disable_after_deals_count,
            stop_loss_percentage: template.stop_loss_percentage,
            cooldown: template.cooldown,
            btc_price_limit: template.btc_price_limit,
            min_volume_btc_24h: template.min_volume_btc_24h,
            profit_currency: template.profit_currency,
            min_price: template.min_price,
            max_price: template.max_price,
            stop_loss_type: template.stop_loss_type,
            trailing_deviation: template.trailing_deviation,
            start_order_type: template.start_order_type
          })
          requests.push(r);

        }
      }
      );
      const result = await Promise.all(requests);
      console.log(`${result.length} bots updated to mirror template`);
      return result;
    }
    catch (error) {
      throw error;
    }
  }).catch(err => console.log(err));
}

module.exports = {
  mirror: mirror
} 