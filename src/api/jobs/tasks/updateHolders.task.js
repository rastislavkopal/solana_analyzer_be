const cron = require('node-cron');
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

const updateHolderTask = cron.schedule('* * * * *', async () => {
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
      const concatData = new Map();
      const ids = [];
      await axios.request(config)
        .then(async (resp) => {
          const { owners } = resp.data.result.data;
          // eslint-disable-next-line no-restricted-syntax
          Object.values(owners).forEach((value) => {
            if (concatData.get(value)) {
              concatData.set(value, concatData.get(value) + 1);
            } else {
              ids.push(value);
              concatData.set(value, 1);
            }
          });
          // concatData.forEach(logMapElements);
          /*
          const items = Array.from(owners.entries(), ([key, value]) => {
            const rObj = {
              updateOne: {
                filter: { walletId: value, 'collections.symbol': it.symbol },
                update: {
                  $inc: { 'collections.itemsCount': 1 },
                },
                upsert: true,
              },
            };
            return rObj;
          });
          await Holder.bulkWrite(items);

           */
          /*
          await Holder.updateMany({ 'collections.symbol': it.symbol },
            { $set: { itemsCount: 0 } });

          const { owners } = resp.data.result.data;

          Object.keys(owners).forEach(async (key) => {
            await Holder.findOneAndUpdate({
              walletId: owners[key],
            }, {
              $inc: { 'collections.itemsCount': 1 },
            }, {
              new: true,
              upsert: true,
            });
          });
           */
        })
        .catch((error) => {
          logger.error(`updateHolderTask error 1: ${error}`);
        });
      const holders = await Holder.find({ 'collections.symbol': it.symbol }, 'walletId');
      const hld = holders.map((holder) => holder.walletId);
      const difference = ids.filter((x) => !hld.includes(x));
      if (difference.length > 0) {
        console.log(it.symbol);
        const items = difference.map((id) => {
          const item = {
            insertOne: {
              document: {
                walletId: id,
                collections: {
                  symbol: it.symbol,
                },
              },
            },
          };
          return item;
        });
        await Holder.bulkWrite(items);
      }
      const itemCount = Array.from(concatData.entries(), ([key, value]) => {
        const rObj = {
          updateOne: {
            filter: { walletId: key, 'collections.symbol': it.symbol },
            update: {
              $set: {
                'collections.$.itemsCount': value,
              },
            },
            upsert: true,
          },
        };
        return rObj;
      });
      await Holder.bulkWrite(itemCount);
    });
  } catch (error) {
    logger.error(`updateHolderTask error 2: ${error}`);
  }
});

module.exports = updateHolderTask;
