const cron = require('node-cron');
const scrapToken = require('../../crawlers/tokenInfoCrawler');
// const mongoose = require('mongoose');
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

// Updates list of collections and its information every 1 minute
const updateItemsTask = cron.schedule('*/5 * * * * **', async () => {
  try {
    // TODO run tokenInfoCrawler
    const result = await scrapToken();
    console.log(result);
  } catch (error) {
    logger.error(`tokenInfoCrawlerTask error 1: ${error}`);
  }

  // logger.info(`Updated collections info: ${collections.length} .. items`);
});

module.exports = updateItemsTask;
