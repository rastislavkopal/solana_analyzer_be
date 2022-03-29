const cron = require('node-cron');
// const mongoose = require('mongoose');
const axios = require('axios');
const Collection = require('../../models/collection.model');
const Holder = require('../../models/holder.model');
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

const updateHolderTask = cron.schedule('0 * * * *', async () => {
  try {
    console.log('----------------JOB---update holders--------------');
    const collections = await Collection.find(
      { raritySymbol: { $exists: true, $ne: null } },
      '_id symbol raritySymbol',
    );

    collections.forEach(async (it) => {
      const config = {
        url: String(`https://howrare.is/api/v0.1/collections/${it.raritySymbol}/owners`),
        httpsAgent: agent,
      };

      axios.request(config)
        .then(async (resp) => {
          await Holder.updateMany({ 'collections.symbol': it.symbol },
            { $set: { itemsCount: 0 } });

          const { owners } = resp.data.result.data;

          Object.keys(owners).forEach(async (key) => {
            await Holder.findOneAndUpdate({
              walletId: owners[key],
            }, {
              $inc: { itemsCount: 1 },
            }, {
              new: true,
              upsert: true,
            });
          });
        })
        .catch((error) => {
          logger.error(`updateHolderTask${error}`);
        });
    });
  } catch (error) {
    logger.error(`${error}`);
  }
});

module.exports = updateHolderTask;
