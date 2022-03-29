/* eslint-disable no-throw-literal,max-len */
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

// const collectionSymbolList = ['888_anon_club'];

async function updateListingTime(ids) {
  const concatData = new Map();
  await ids.forEach(async (id) => {
    const config = {
      url: String(`https://api-mainnet.magiceden.io/rpc/getGlobalActivitiesByQuery?q={"$match":{"mint":"${id}"},"$sort":{"blockTime":-1,"createdAt":-1},"$skip":0}`),
      httpsAgent: agent,
    };
    axios.request(config)
      .then(async (periodResponse) => {
        if (periodResponse.code === 'ECONNRESET' || periodResponse.code === 'ERR_SOCKET_CLOSED') throw new Error('An error occured while reaching magiceden api');
        const { results } = periodResponse.data;
        results.forEach(async (it) => {
          let listedFor;
          if (it.txType === 'initializeEscrow') {
            const timeDiff = (new Date(Date.now()) - Date.parse(it.createdAt));
            const inHours = Number(timeDiff / 3600000)
              .toFixed(2);
            if (inHours < 1) {
              listedFor = '< 1 hour';
            } else {
              listedFor = `${inHours} hours`;
            }
            concatData.set(it.mint, listedFor);
          }
        });
      })
      .catch((error) => {
        logger.error(`updateListingTime error 1: ${error}`);
      });
    // eslint-disable-next-line no-shadow
    const items = Array.from(concatData.entries(), ([key, value]) => {
      const rObj = {
        mintAddress: key,
        listedFor: value,
      };
      return rObj;
    });
    Item.upsertMany(items).then(() => {}).catch((err) => { logger.error(`updateListingTime error 2: ${err}`); });
  });
}
async function updateItemsOf(symbol) {
  try {
    const collection = await Collection.findOne({ symbol }).exec();
    const limit = 100;

    if (!collection) {
      logger.error(`listedPriceDistributionTask---${symbol}---Collection not found`);
    }
    const collectionTs = await CollectionTs.find({ 'metadata.symbol': symbol }, '-_id metadata timestamp')
      .sort({ timestamp: -1 })
      .limit(limit);

    const { listedCount } = collectionTs[0].metadata;
    if (listedCount > 300 || !listedCount) {
      // Add more unsupported cases ( E.g. cooldown on this function )
      logger.error(`listedPriceDistributionTask---${symbol}---Collection of this size is unsupported(${listedCount})`);
      return;
    }
    const { raritySymbol } = collection;
    const rarityResp = await RaritySheet.findOne({ raritySymbol });
    if (!rarityResp) {
      logger.error(`listedPriceDistributionTask---${symbol}---RaritySheet not found!`);
    }
    let iterations = Math.ceil(listedCount / 20);
    const remainder = listedCount % 20;
    let step;
    if (iterations > 2) {
      iterations = 2;
      step = 20;
    } else step = remainder;

    let index = 0;
    const concatData = new Map();
    const ids = [];
    for (let i = 0; i < iterations; i += 1) {
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
              });
            });
            await ItemService.updateItemsFromMap(concatData, symbol);
            updateListingTime(ids);
          }
        })
        .catch((error) => {
          logger.error(`updateItemsOf error 1: ${error}`);
        });
      index += step;
      step = 20;
    }
  } catch (error) {
    logger.error(`updateItemsOf error 5: ${error}`);
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
