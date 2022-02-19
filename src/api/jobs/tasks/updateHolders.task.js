const cron = require('node-cron');
const axios = require('axios');
const Collection = require('../../models/collection.model');
const { agent } = require('../../utils/proxyGenerator');
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

// https://howrare.is/api/v0.1/collections/{collection}/owners
const updateHolderTask = cron.schedule('*/30 * * * * **', async () => {
  try {
    const collections = await Collection.find({}, 'symbol raritySymbol');

    collections.forEach(async (it) => {
      const config = {
        url: String(`https://api-mainnet.magiceden.io/rpc/getCollectionEscrowStats/${it.raritySymbol}`),
        httpsAgent: agent,
      };

      axios.request(config)
        .then((resp) => resp.result.data)
        .then((data) => console.log(data)) // TODO iterate and update holders/owners
        .catch((error) => { throw error; });
    });
  } catch (error) {
    logger.error(`${error}`);
  }
});

module.exports = updateHolderTask;
