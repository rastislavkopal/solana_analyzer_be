const cron = require('node-cron');
const axios = require('axios');
const Collection = require('../../models/collection.model');
const logger = require('../../../config/logger');

// # ┌────────────── second (optional)
// # │ ┌──────────── minute
// # │ │ ┌────────── hour
// # │ │ │ ┌──────── day of month
// # │ │ │ │ ┌────── month
// # │ │ │ │ │ ┌──── day of week
// # │ │ │ │ │ │
// # │ │ │ │ │ │
// # * * * * * *

// Updates list of collections and its information every minute
const updateCollectionTask = cron.schedule('* * * * *', async () => {
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
          }, {
            select: '_id collection_name_id',
            upsert: true,
            rawResult: false,
          }, (err) => {
            if (err) logger.info(err);
          });
        });
      })
      .catch((error) => {
        logger.info(error.message);
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
          }, {
            select: '_id collection_name_id',
            upsert: true,
            rawResult: false,
          }, (err) => {
            if (err) logger.info(err);
          });
        });
      })
      .catch((error) => {
        logger.info(error.message);
      });
  } catch (error) {
    logger.error(error);
  }

  const collections = await Collection.find({});
  logger.info(`Updated collections info: ${collections.length} .. items`);
});

module.exports = updateCollectionTask;
