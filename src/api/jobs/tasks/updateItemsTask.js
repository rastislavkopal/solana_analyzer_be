/* eslint-disable no-throw-literal */
const cron = require('node-cron');
const axios = require('axios');
const CollectionTs = require('../../models/collectionTs.model');
const Item = require('../../models/item.model');
const RaritySheet = require('../../models/raritySheet.model');
const { agent } = require('../../utils/proxyGenerator');
const logger = require('../../../config/logger');
const Collection = require('../../models/collection.model');
const CollectionService = require('../../services/collection.service');

// const collectionSymbolList = ['888_anon_club'];

async function updateItemsFromData(concatData, symbol) {
  console.log('Updating items....');
  concatData.forEach((value, key) => {
    Item.updateOne({ mintAddress: key },
      {
        $set:
          {
            listedFor: value.price,
            rank: value.rank,
            forSale: true,
            collectionId: value.collectionId,
            name: value.name,
            mintAddress: key,
            collectionSymbol: symbol,
          },
      },
      { upsert: true }).then(() => {
      // console.log('Finished updating...');
    });
  });
}

async function updateItemsOf(symbol) {
  try {
    const collection = await Collection.findOne({ symbol }).exec();
    const limit = 100;

    if (!collection) {
      throw { name: 'CollectionNotFound', message: `listedPriceDistributionTask---${symbol}---Collection not found` };
    }
    const collectionTs = await CollectionTs.find({ 'metadata.symbol': symbol }, '-_id metadata timestamp')
      .sort({ timestamp: -1 })
      .limit(limit);

    const { listedCount } = collectionTs[0].metadata;
    if (listedCount > 500 || !listedCount) {
      // Add more unsupported cases ( E.g. cooldown on this function )
      throw { name: 'UnsupportedSize', message: `listedPriceDistributionTask---${symbol}---Collection of this size is unsupported(${listedCount})` };
    }
    const { raritySymbol } = collection;
    const rarityResp = await RaritySheet.findOne({ raritySymbol });
    if (!rarityResp) {
      throw { name: 'RaritySheetNotFound', message: `listedPriceDistributionTask---${symbol}---RaritySheet not found!` };
    }
    const iterations = Math.ceil(listedCount / 20);
    const remainder = listedCount % 20;
    let index = 0;
    let step = remainder;
    const concatData = new Map();
    const requestsPrice = [];
    const ids = [];
    for (let i = 0; i < iterations; i += 1) {
      const config = {
        url: String(`https://api-mainnet.magiceden.io/rpc/getListedNFTsByQuery?q={"$match":{"collectionSymbol":"${symbol}"},"$sort":{"takerAmount":1,"createdAt":-1},"$skip":${index},"$limit":${step}}`),
        httpsAgent: agent,
      };
      requestsPrice.push(axios.request(config)
        .then((priceResponse) => {
          if (priceResponse.status === 200) {
            const { results } = priceResponse.data;
            results.forEach(async (it) => {
              ids.push(it.mintAddress);
              const { rank } = rarityResp.items.get(it.mintAddress);
              concatData.set(it.mintAddress, {
                mintAddress: it.mintAddress,
                price: it.price,
                listedFor: null,
                rank,
                collectionSymbol: symbol,
                collectionId: collection._id,
                name: it.title,
              });
            });
          }
        })
        .catch((error) => {
          throw error;
        }));
      index += step;
      step = 20;
    }
    Promise.allSettled(requestsPrice)
      .then(() => {
        const requestsPeriod = [];
        ids.forEach(async (id) => {
          const config = {
            url: String(`https://api-mainnet.magiceden.io/rpc/getGlobalActivitiesByQuery?q={"$match":{"mint":"${id}"},"$sort":{"blockTime":-1,"createdAt":-1},"$skip":0}`),
            httpsAgent: agent,
          };
          requestsPeriod.push(
            axios.request(config)
              .then((periodResponse) => {
                if (periodResponse.code === 'ECONNRESET' || periodResponse.code === 'ERR_SOCKET_CLOSED') throw new Error('An error occured while reaching magiceden api');
                const { results } = periodResponse.data;
                results.every((it) => {
                  // can't be async - we are looking at the first occurence of 'initializeEscrow'
                  if (it.txType === 'initializeEscrow') {
                    const timeDiff = (new Date(Date.now()) - Date.parse(it.createdAt));
                    const inHours = Number(timeDiff / 3600000)
                      .toFixed(2);
                    if (inHours < 1) concatData[it.mint].listedFor = '< 1 hour';
                    else concatData[it.mint].listedFor = `${inHours} hours`;
                    return false;
                  }
                  return true;
                });
              })
              .catch((error) => {
                throw error;
              }),
          );
        });
        Promise.allSettled(requestsPeriod)
          .then(() => updateItemsFromData(concatData, symbol))
          .catch((error) => { throw error; });
      })
      .catch((error) => { throw error; });
  } catch (error) {
    logger.error(`${error}`);
  }
}
// '*/5 * * * *'
const updateItemsTask = cron.schedule('* * * * *', async () => {
  console.log('ListedPriceDistribution-JOB---');
  const activeCollections = await CollectionService.loadActive();
  console.log(`Active: ${JSON.stringify(activeCollections)}`);
  if (Object.keys(activeCollections).length > 0) {
    activeCollections.forEach((symbol) => {
      updateItemsOf(symbol);
    });
  }
});

module.exports = updateItemsTask;
