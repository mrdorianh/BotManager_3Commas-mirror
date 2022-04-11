let api;
const init = (_api) => {
  if (!_api) {
    console.log("No API found");
  }
  else {
    api = _api;
  }
}
const getCurrentSettings = async () => {
  if (!api) {
    throw "No API found";
  }
  return await api.getBots({
    limit: 150,
    strategy: 'long',
  }).then((bots) => {
    return bots.reverse().find(element => element.name != "_template_");
  }).catch(err => {
    console.log(err);
    return null;
  })
}
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
           
            bot_id: element.id,
            name: element.name,
            pairs: element.pairs,
            //BO
            base_order_volume: mirrorSettings.base_order_volume || element.base_order_volume,
            start_order_type: mirrorSettings.start_order_type || element.start_order_type,
            strategy_list: mirrorSettings.strategy_list || element.strategy_list,
            //SO
            safety_order_volume: mirrorSettings.safety_order_volume || element.safety_order_volume, // so size
            martingale_volume_coefficient: mirrorSettings.martingale_volume_coefficient || element.martingale_volume_coefficient, //so size scale
            safety_order_step_percentage: mirrorSettings.safety_order_step_percentage || element.safety_order_step_percentage, //so price dev to place order
            martingale_step_coefficient: mirrorSettings.martingale_step_coefficient || element.martingale_step_coefficient, //so price dev step scale
            max_safety_orders: mirrorSettings.max_safety_orders || element.max_safety_orders,
            active_safety_orders_count: mirrorSettings.active_safety_orders_count || element.active_safety_orders_count,
            //SL
            stop_loss_timeout_enabled: mirrorSettings.stop_loss_timeout_enabled || element.stop_loss_timeout_enabled,
            stop_loss_timeout_in_seconds: mirrorSettings.stop_loss_timeout_in_seconds || element.stop_loss_timeout_in_seconds,
            stop_loss_percentage: mirrorSettings.stop_loss_percentage || element.stop_loss_percentage,
            stop_loss_type: mirrorSettings.stop_loss_type || element.stop_loss_type,
            tsl_enabled: mirrorSettings.tsl_enabled || element.tsl_enabled, //bitmex only
            
            //TP
            take_profit: mirrorSettings.take_profit || element.take_profit,
            take_profit_type: mirrorSettings.take_profit_type || element.take_profit_type,
            trailing_enabled: mirrorSettings.trailing_enabled || element.trailing_enabled,
            trailing_deviation: mirrorSettings.trailing_deviation || element.trailing_deviation,
            //Pro
            deal_start_delay_seconds: mirrorSettings.deal_start_delay_seconds || element.deal_start_delay_seconds,
            max_active_deals: mirrorSettings.max_active_deals || element.max_active_deals,
            disable_after_deals_count: mirrorSettings.disable_after_deals_count || element.disable_after_deals_count,
            cooldown: mirrorSettings.cooldown || element.cooldown,
            btc_price_limit: mirrorSettings.btc_price_limit || element.btc_price_limit,
            min_volume_btc_24h: mirrorSettings.min_volume_btc_24h || element.min_volume_btc_24h,
            profit_currency: mirrorSettings.profit_currency || element.profit_currency,
            min_price: mirrorSettings.min_price || element.min_price,
            max_price: mirrorSettings.max_price || element.max_price,
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
  init: init,
  getCurrentSettings: getCurrentSettings,
  mirror: mirror
} 