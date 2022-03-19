const cron = require('node-cron');
const mongoose = require('mongoose');
const requestService = require('../../services/request.service')
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
    const collections = await Collection.find({}, '_id symbol raritySymbol');

    collections.forEach(async (it) => {
      const config = {
        url: String(`https://howrare.is/api/v0.1/collections/${it.raritySymbol}/owners`),
        httpsAgent: agent,
      };

      requestService.request(config)
        .then(async (resp) => {
          await Holder.updateMany({ collectionId: it._id },
            { $set: { itemsCount: 0 } });

          const { owners } = resp.data.result.data;

          Object.keys(owners).forEach(async (key) => {
            await Holder.findOneAndUpdate({
              walletId: owners[key],
              collectionId: it._id,
            }, {
              $inc: { itemsCount: 1 },
            }, {
              new: true,
              upsert: true,
            });
          });
        })
        .catch((error) => {
          logger.error(error);
        });
    });
  } catch (error) {
    logger.error(`${error}`);
  }
});

module.exports = updateHolderTask;
