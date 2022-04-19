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
    if (listedCount > 1500 || !listedCount) {
      // Add more unsupported cases ( E.g. cooldown on this function )
      logger.error(`listedPriceDistributionTask1m---${symbol}---Collection of this size is unsupported(${listedCount})`);
      return;
    }
    let iterations = Math.ceil(listedCount / 20);
    const remainder = listedCount % 20;
    let step;
    if (iterations > 3) {
      iterations = 3;
      step = 20;
    } else step = remainder;

    let index = 0;
    const allIDs = [];
    for (let i = 0; i < iterations; i += 1) {
      const concatData = new Map();
      const ids = [];
      const config = {
        url: String(`https://api-mainnet.magiceden.dev/rpc/getListedNFTsByQuery?q={"$match":{"collectionSymbol":"${symbol}"},"$sort":{"takerAmount":1},"$skip":${index},"$limit":${step},"status":[]}`),
        httpsAgent: agent,
      };
      axios.request(config)
        .then(async (priceResponse) => {
          if (priceResponse.status === 200) {
            const { results } = priceResponse.data;
            results.forEach(async (it) => {
              ids.push(it.mintAddress);
              // zmenit rank it.rarity.howrare
              const { rarity } = it;
              let ranking = -1;
              // eslint-disable-next-line no-prototype-builtins
              if (rarity.hasOwnProperty('howrare')) {
                const { rank } = rarity.howrare;
                ranking = rank;
                // eslint-disable-next-line no-prototype-builtins
              } else if (rarity.hasOwnProperty('moonrank')) {
                const { rank } = rarity.moonrank;
                ranking = rank;
              }
              concatData.set(it.mintAddress, {
                mintAddress: it.mintAddress,
                price: it.price,
                listedFor: null,
                rank: ranking,
                collectionSymbol: symbol,
                name: it.title,
                img: it.img,
                forSale: true,
              });
            });
            allIDs.push(ids);
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
    ItemService.updateForSale1m(allIDs, symbol);
  } catch (error) {
    logger.error(`updateItemsOf1m error 5: ${error}`);
  }
}
// '*/5 * * * *'
const updateItemsTask = cron.schedule('* * * * *', async () => {
  console.log('updateItemsTask1m-JOB---');
  try {
    const activeCollections = await CollectionService.loadActive();
    console.log(`Active: ${JSON.stringify(activeCollections)}`);
    if (activeCollections && Object.keys(activeCollections).length > 0) {
      activeCollections.forEach((symbol) => {
        updateItemsOf(symbol);
      });
    }
  } catch (e) {
    logger.error(`updateItemsTask1m error:${e}`);
  }
});

module.exports = updateItemsTask;
