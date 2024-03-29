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

const updateHolderTask = cron.schedule('*/15 * * * *', async () => {
  try {
    console.log('----------------JOB---update holders--------------');
    const collections = await Collection.find(
      { raritySymbol: { $exists: true, $ne: null } },
      '_id symbol raritySymbol',
    ).catch((e) => {
      logger.error(`updateHolderTask error 0: ${e}`);
    });

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
        })
        .catch((error) => {
          logger.error(`updateHolderTask error 1: ${error}`);
        });
      const holders = await Holder.find({ symbol: it.symbol }, 'walletId').catch((e) => {
        logger.error(`updateHolderTask error 2: ${e}`);
      });
      const hld = holders.map((holder) => holder.walletId);
      const toAdd = ids.filter((x) => !hld.includes(x));
      const toRemove = hld.filter((x) => !ids.includes(x));
      toRemove.push('');
      if (toRemove.length > 0) {
        const items = toAdd.map((id) => {
          const item = {
            deleteOne: {
              filter: { walletId: id, symbol: it.symbol },
            },
          };
          return item;
        });
        Holder.bulkWrite(items, { ordered: false }).catch((e) => {
          logger.error(`updateHolderTask error 2: ${e}`);
        });
      }

      if (toAdd.length > 0) {
        const items = toAdd.flatMap((id) => {
          if (id !== undefined || id !== '' || id !== 'undefined') {
            const item = {
              insertOne: {
                document: {
                  walletId: id,
                  symbol: it.symbol,
                },
              },
            };
            return [item];
          } return [];
        });
        await Holder.bulkWrite(items, { ordered: false }).catch((e) => {
          logger.error(`updateHolderTask error 3: ${e}`);
        });
      }

      const itemCount = Array.from(concatData.entries(), ([key, value]) => {
        const isWhale = value > 6;
        const rObj = {
          updateOne: {
            filter: { walletId: key, symbol: it.symbol },
            update: {
              $set: {
                itemsCount: value,
                isWhale,
              },
            },
            upsert: true,
          },
        };
        return rObj;
      });
      Holder.bulkWrite(itemCount, { ordered: false }).catch((e) => {
        logger.error(`updateHolderTask error 4: ${e}`);
      });
    });
  } catch (error) {
    logger.error(`updateHolderTask error 5: ${error}`);
  }
});

module.exports = updateHolderTask;
