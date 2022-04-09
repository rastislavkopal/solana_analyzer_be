const cron = require('node-cron');
const axios = require('axios');
const CollectionTs = require('../../models/collectionTs.model');
const Item = require('../../models/item.model');
const RaritySheet = require('../../models/raritySheet.model');
const { agent } = require('../../utils/proxyGenerator');
const logger = require('../../../config/logger');
const Collection = require('../../models/collection.model');
const CollectionService = require('../../services/collection.service');
const ItemService = require('../../services/item.service');

async function updateListingTime(ids) {
  console.log('Updating listedFor of items');
  const concatData = new Map();
  await Promise.all(ids.map(async (id) => {
    const config = {
      url: String(`https://api-mainnet.magiceden.io/rpc/getGlobalActivitiesByQuery?q={"$match":{"mint":"${id}"},"$sort":{"blockTime":-1,"createdAt":-1},"$skip":0}`),
      httpsAgent: agent,
    };
    return axios.request(config)
      .then((periodResponse) => {
        if (periodResponse.code === 'ECONNRESET' || periodResponse.code === 'ERR_SOCKET_CLOSED') throw new Error('An error occured while reaching magiceden api');
        const { results } = periodResponse.data;
        results.every((it) => {
          let listedFor;
          if (it.txType === 'initializeEscrow') {
            const timeDiff = (new Date(Date.now()) - Date.parse(it.createdAt));
            const inMinutes = Number(timeDiff / 60000)
              .toFixed(2);
            listedFor = inMinutes;
            concatData.set(it.mint, listedFor);
            return false;
          }
          return true;
        });
      })
      .catch((error) => {
        logger.error(`updateListingTime1m error 1: ${error}`);
      });
  }));
  const items = Array.from(concatData.entries(), ([key, value]) => {
    const rObj = {
      updateOne: {
        filter: { mintAddress: key },
        update: {
          $set: {
            listedFor: value,
          },
        },
        upsert: true,
      },
    };
    return rObj;
  });
  Item.bulkWrite(items);
}
async function updateForSale(allIDs, symbol) {
  const itemsResult = await Item.find({ mintAddress: allIDs, collectionSymbol: symbol });
}
async function updateItemsOf(symbol) {
  try {
    const collection = await Collection.findOne({ symbol }).exec();
    const limit = 100;

    if (!collection) {
      logger.error(`listedPriceDistributionTask1m---${symbol}---Collection not found`);
    }
    const collectionTs = await CollectionTs.find({ 'metadata.symbol': symbol }, '-_id metadata timestamp')
      .sort({ timestamp: -1 })
      .limit(limit);

    const { listedCount } = collectionTs[0].metadata;
    if (listedCount > 300 || !listedCount) {
      // Add more unsupported cases ( E.g. cooldown on this function )
      logger.error(`listedPriceDistributionTask1m---${symbol}---Collection of this size is unsupported(${listedCount})`);
      return;
    }
    const { raritySymbol } = collection;
    const rarityResp = await RaritySheet.findOne({ raritySymbol });
    if (!rarityResp) {
      logger.error(`listedPriceDistributionTask1m---${symbol}---RaritySheet not found!`);
    }
    let iterations = Math.ceil(listedCount / 20);
    const remainder = listedCount % 20;
    let step;
    if (iterations > 3) {
      iterations = 3;
      step = 20;
    } else step = remainder;

    let index = 0;
    for (let i = 0; i < iterations; i += 1) {
      const concatData = new Map();
      const ids = [];
      const config = {
        url: String(`https://api-mainnet.magiceden.io/rpc/getListedNFTsByQuery?q={"$match":{"collectionSymbol":"${symbol}"},"$sort":{"takerAmount":1,"createdAt":-1},"$skip":${index},"$limit":${step}}`),
        httpsAgent: agent,
      };
      axios.request(config)
        .then(async (priceResponse) => {
          if (priceResponse.status === 200) {
            const { results } = priceResponse.data;
            results.forEach(async (it) => {
              ids.push(it.mintAddress);
              const { rank } = (rarityResp && rarityResp.items
                  && rarityResp.items.has(it.mintAddress))
                ? rarityResp.items.get(it.mintAddress) : '';
              concatData.set(it.mintAddress, {
                mintAddress: it.mintAddress,
                price: it.price,
                listedFor: null,
                rank,
                collectionSymbol: symbol,
                name: it.title,
                img: it.img,
              });
            });
            ItemService.updateForSale(ids, symbol);
            await ItemService.updateItemsFromMap(concatData, symbol);
            ItemService.updateListingTime(ids, symbol);
          }
        })
        .catch((error) => {
          logger.error(`updateItemsOf1m error 1: ${error}`);
        });
      index += step;
      step = 20;
    }
    // updateForSale(allIDs, symbol);
  } catch (error) {
    logger.error(`updateItemsOf1m error 5: ${error}`);
  }
}
// '*/5 * * * *'
const updateItemsTask = cron.schedule('* * * * *', async () => {
  console.log('updateItemsTask1m-JOB---');
  const activeCollections = await CollectionService.loadActive();
  console.log(`Active: ${JSON.stringify(activeCollections)}`);
  if (Object.keys(activeCollections).length > 0) {
    activeCollections.forEach((symbol) => {
      updateItemsOf(symbol);
    });
  }
});

module.exports = updateItemsTask;
