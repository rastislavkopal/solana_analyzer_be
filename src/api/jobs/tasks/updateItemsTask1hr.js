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
const Transaction = require("../../models/transaction.model");

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
            const inMinutes = Number(timeDiff / 60000)
              .toFixed(2);
            listedFor = inMinutes;
            concatData.set(it.mint, listedFor);
          }
        });
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
      })
      .catch((error) => {
        logger.error(`updateListingTime error 1: ${error}`);
      });
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
    const batchSize = 5;
    let iterations = Math.ceil(listedCount / 20);
    let batches = Math.floor(iterations / batchSize);
    const iterationRemainder = iterations % batchSize;
    if (iterationRemainder > 0) batches += 1;
    iterations = Math.round(iterations / batches);

    const remainder = listedCount % 20;
    let index = 0;
    let step = remainder;
    const concatData = new Map();
    const ids = [];
    for (let h = 0; h < batches; h += 1) {
      if (h === batches - 1 && iterationRemainder !== 0) iterations %= 10;
      else iterations = 10;
      console.log(`UpdateItems--${symbol}--BATCH--${h}--`);
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
    }
  } catch (error) {
    logger.error(`updateItemsOf error 5: ${error}`);
  }
}
// '*/5 * * * *'
const updateItemsTask1hr = cron.schedule('0 * * * *', async () => {
  console.log('updateItemsTask1hr-JOB---');
  const activeCollections = await CollectionService.loadActive();
  console.log(`Active: ${JSON.stringify(activeCollections)}`);
  if (Object.keys(activeCollections).length > 0) {
    activeCollections.forEach((symbol) => {
      updateItemsOf(symbol);
    });
  }
});

module.exports = updateItemsTask1hr;
