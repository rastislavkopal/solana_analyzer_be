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
  const items = Array.from(concatData.entries(), ([key, value]) => {
    const rObj = {
      mintAddress: key,
      rank: value.rank,
      listedFor: value.price,
      forSale: true,
      collectionId: value.collectionId,
      name: value.name,
      collectionSymbol: symbol,
      price: value.price,
    };
    return rObj;
  });

  Item.upsertMany(items).then(() => {}).catch((err) => { logger.error(`updateItemsFromData: ${err}`); });
  /*
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
   */
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
    const requestsPrice = [];
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
        requestsPrice.push(axios.request(config)
          .then((priceResponse) => {
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
                  collectionId: collection._id,
                  name: it.title,
                });
              });
            }
          })
          .catch((error) => {
            logger.error(`updateItemsOf error 1: ${error}`);
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
                    const tmp = concatData.get(it.mint);

                    if (it.txType === 'initializeEscrow') {
                      const timeDiff = (new Date(Date.now()) - Date.parse(it.createdAt));
                      const inHours = Number(timeDiff / 3600000)
                        .toFixed(2);
                      if (inHours < 1) {
                        tmp.listedFor = '< 1 hour';
                      } else {
                        tmp.listedFor = `${inHours} hours`;
                      }
                      concatData.set(it.mint, tmp);
                      return false;
                    }
                    return true;
                  });
                })
                .catch((error) => {
                  logger.error(`updateItemsOf error 2: ${error}`);
                }),
            );
          });
          Promise.allSettled(requestsPeriod)
            .then(() => {
              updateItemsFromData(concatData, symbol);
              concatData.clear();
            })
            .catch((error) => {
              logger.error(`updateItemsOf error 3: ${error}`);
            });
        })
        .catch((error) => {
          logger.error(`updateItemsOf error 4: ${error}`);
        });
    }
  } catch (error) {
    logger.error(`updateItemsOf error 5: ${error}`);
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
