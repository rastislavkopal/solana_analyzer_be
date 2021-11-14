// const httpStatus = require('http-status');
const axios = require('axios');
const Collection = require('../models/collection.model');

/**
 * Get Solanart collections list
 * @public
 */
exports.listSolanart = async (req, res, next) => {
  try {
    // get and update collections and their basic info
    axios
      .get('https://qzlsklfacc.medianetwork.cloud/get_collections')
      .then((response) => {
        response.data.forEach((element) => {
          Collection.findOneAndUpdate({ collection_name_id: element.url }, {
            description: element.description,
            collection_full_name: element.name,
            creators: element.creators,
            market_name: 'solanart.io',
          }, { new: true, upsert: true }, (err) => {
            if (err) console.log(err);
          });
        });
      })
      .catch((error) => {
        console.log(error.message);
      });

    // update collection with daily_sales, volumes etc..
    axios
      .get('https://qzlsklfacc.medianetwork.cloud/query_volume_all')
      .then((response) => {
        response.data.forEach((element) => {
          Collection.findOneAndUpdate({ collection_name_id: element.collection }, {
            total_volume: element.totalVolume,
            daily_volume: element.dailyVolume,
            weekly_volume: element.weeklyVolume,
            total_sales: element.totalSales,
            daily_sales: element.dailySales,
            weekly_sales: element.weeklySales,
            api_last_updated: element.lastUpdated,
            prev_daily_sales: element.prevDailyVolume,
            prev_daily_volume: element.prevDailyVolume,
            prev_weekly_sales: element.prevWeeklySales,
            prev_weekly_volume: element.prevWeeklyVolume,
            category: element.category,
          }, { new: true, upsert: true }, (err) => {
            if (err) console.log(err);
          });
        });
      })
      .catch((error) => {
        console.log(error.message);
      });
  } catch (error) {
    next(error);
  }

  const collections = await Collection.find({});
  res.setHeader('Content-Type', 'application/json');
  res.json(collections);
};
