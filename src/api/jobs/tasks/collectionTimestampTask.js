const cron = require('node-cron');
// const mongoose = require('mongoose');
const axios = require('axios');
// const Collection = require('../../models/collection.model');
const CollectionTs = require('../../models/collectionTs.model');
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
const updateItemsTask = cron.schedule('*/60 * * * * **', async () => {
  try {
    const resp = await axios.get('https://api-mainnet.magiceden.io/rpc/getCollectionEscrowStats/degenerate_ape_academy');
    // console.log(resp.data);
    const { results } = resp.data;
    const now = new Date(Date.now());
    const timestamp = new CollectionTs({
      metadata: {
        collectionId: results.symbol,
        floorPrice: results.floorPrice,
        listedCount: results.listedCount,
        listedTotalValue: results.listedTotalValue,
        avgPrice24hr: results.avgPrice24hr,
        volume24hr: results.volume24hr,
        volumeAll: results.volumeAll,
      },
      timestamp: now.toISOString(),
      // temp: 12,
    });
    timestamp.save((err) => {
      if (err) logger.error(`${err}`); // saved!
    });
  } catch (error) {
    logger.error(`${error}`);
  }
});

module.exports = updateItemsTask;
