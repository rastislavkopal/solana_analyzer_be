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
    await ItemService.updateForSale1h(symbol);
    const collection = await Collection.findOne({ symbol }).exec();
    const limit = 100;

    if (!collection) {
      logger.error(`listedPriceDistributionTask1hr---${symbol}---Collection not found`);
    }
    const collectionTs = await CollectionTs.find({ 'metadata.symbol': symbol }, '-_id metadata timestamp')
      .sort({ timestamp: -1 })
      .limit(limit);

    let { listedCount } = collectionTs[0].metadata;
    if (listedCount > 1500 || !listedCount) {
      // Add more unsupported cases ( E.g. cooldown on this function )
      logger.error(`listedPriceDistributionTask1hr---${symbol}---Collection of this size is unsupported(${listedCount})`);
      return;
    }
    const { raritySymbol } = collection;
    const rarityResp = await RaritySheet.findOne({ raritySymbol });
    if (!rarityResp) {
      logger.error(`listedPriceDistributionTask1hr---${symbol}---RaritySheet not found!`);
    }
    // limited to 100 items.
    listedCount = 200;
    const batchSize = 5;
    let iterations = Math.ceil(listedCount / 20);
    let batches = Math.floor(iterations / batchSize);
    const iterationRemainder = iterations % batchSize;
    if (iterationRemainder > 0) batches += 1;
    iterations = Math.round(iterations / batches);

    const remainder = listedCount % 20;
    let index = 0;
    let step = remainder;
    for (let h = 0; h < batches; h += 1) {
      const concatData = new Map();
      const ids = [];
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
                  img: it.img,
                  forSale: true,
                });
              });
              await ItemService.updateItemsFromMap(concatData, symbol);
              // ItemService.updateListingTime(ids, symbol);
            }
          })
          .catch((error) => {
            logger.error(`updateItemsOf1hr error 1: ${error}`);
          });
        index += step;
        step = 20;
      }
    }
  } catch (error) {
    logger.error(`updateItemsOf1hr error 5: ${error}`);
  }
}
// '*/5 * * * *'
// 0 * * * *
const updateItemsTask1hr = cron.schedule('*/5 * * * *', async () => {
  try {
    console.log('updateItemsTask1hr-JOB---');
    const activeCollections = await CollectionService.loadActive();
    console.log(`Active: ${JSON.stringify(activeCollections)}`);
    if (activeCollections && Object.keys(activeCollections).length > 0) {
      activeCollections.forEach((symbol) => {
        updateItemsOf(symbol);
      });
    }
  } catch (e) {
    logger.error(`updateItemsTask1hr error: ${e}`);
  }
});

module.exports = updateItemsTask1hr;
