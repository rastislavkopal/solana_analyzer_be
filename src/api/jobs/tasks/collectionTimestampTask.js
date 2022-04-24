const cron = require('node-cron');
const axios = require('axios');
const Collection = require('../../models/collection.model');
const CollectionTs = require('../../models/collectionTs.model');
const logger = require('../../../config/logger');
const { agent } = require('../../utils/proxyGenerator');

function calculateChange(collectionTsNow, collectionsTs24hBefore, option) {
  if (collectionsTs24hBefore.length < 1 || !collectionTsNow || collectionTsNow.length < 1) return 'NaN';

  let change = Number(0);
  if (!collectionTsNow.metadata || !collectionsTs24hBefore.metadata) {
    if (!collectionTsNow.metadata) logger.error('CollectionTsNow metadata are undefined.');
    if (!collectionsTs24hBefore.metadata) logger.error('CollectionTs24hBefore metadata are undefined.');
    return '';
  }

  const valNow = collectionTsNow.metadata[option];
  const valBefore = collectionsTs24hBefore.metadata[option];
  if (valNow === valBefore) return Number(change);

  if (valNow > valBefore) {
    change = Number((valNow / valBefore) * 100 - 100);
  } else {
    change = Number(100 - ((valNow / valBefore) * 100));
    change = -change;
  }

  // change.toFixed(2);
  change = Math.round(change * 100) / 100;
  return Number(change);
}

async function saveCollectionTimestampFromResponse(resp, image, name) {
  try {
    console.log('Saving collectionTs...');
    if (resp.status !== 200 || Object.keys(resp.data).length === 0) throw new Error('An error occured while fetching data.');
    const { results } = resp.data;
    const now = new Date(Date.now()).toISOString();
    const now5min = new Date(Date.now() - (300 * 1000)).toISOString();
    const before24h = new Date(Date.now() - (3600 * 1000 * 24)).toISOString();

    let collectionTsNow = await CollectionTs.findOne({ 'metadata.symbol': results.symbol, timestamp: { $gte: now5min } });
    if (!collectionTsNow) {
      collectionTsNow = await CollectionTs.find({
        'metadata.symbol': results.symbol,
        timestamp: { $lte: now5min },
      })
        .sort({ timestamp: -1 }).limit(1);
    }
    let collectionsTs24hBefore = await CollectionTs.findOne({ 'metadata.symbol': results.symbol, timestamp: { $gte: before24h } });
    if (!collectionsTs24hBefore) {
      collectionsTs24hBefore = await CollectionTs.find({ 'metadata.symbol': results.symbol, timestamp: { $lte: before24h } })
        .sort({ timestamp: -1 }).limit(1);
    }
    // console.log('The collection now  : '+JSON.stringify(collectionTsNow));
    // console.log('The collection from before : '+JSON.stringify(collectionsTs24hBefore));
    const floorPriceChange = calculateChange(collectionTsNow, collectionsTs24hBefore, 'floorPrice');
    const listedCountChange = calculateChange(collectionTsNow, collectionsTs24hBefore, 'listedCount');
    const collectiontsRecent = await CollectionTs.findOne({ 'metadata.symbol': results.symbol, recent: true });
    if (collectiontsRecent) {
      const update = {
        $set: {
          name,
          metadata: {
            symbol: results.symbol,
            floorPrice: results.floorPrice,
            listedCount: results.listedCount,
            listedTotalValue: results.listedTotalValue,
            avgPrice24hr: results.avgPrice24hr,
            volume24hr: results.volume24hr,
            volumeAll: results.volumeAll,
            image,
            floorPriceChange,
            listedCountChange,
          },
          timestamp: now,
        },
      };
      CollectionTs.updateOne({ 'metadata.symbol': results.symbol, recent: true }, { update }).catch((e) => {
        logger.error(`saveCollectionTimestampFromResponse error 1: ${e}`);
      });
    } else {
      const timestamp = new CollectionTs({
        name,
        recent: true,
        metadata: {
          symbol: results.symbol,
          floorPrice: results.floorPrice,
          listedCount: results.listedCount,
          listedTotalValue: results.listedTotalValue,
          avgPrice24hr: results.avgPrice24hr,
          volume24hr: results.volume24hr,
          volumeAll: results.volumeAll,
          image,
          floorPriceChange,
          listedCountChange,
        },
        timestamp: now,
      });
      timestamp.save((err) => {
        if (err) logger.error(`saveCollectionTimestampFromResponse error 2: ${err}`); // saved
      });
    }
    const timestamp = new CollectionTs({
      name,
      metadata: {
        symbol: results.symbol,
        floorPrice: results.floorPrice,
        listedCount: results.listedCount,
        listedTotalValue: results.listedTotalValue,
        avgPrice24hr: results.avgPrice24hr,
        volume24hr: results.volume24hr,
        volumeAll: results.volumeAll,
        image,
        floorPriceChange,
        listedCountChange,
      },
      timestamp: now,
    });
    timestamp.save((err) => {
      if (err) logger.error(`saveCollectionTimestampFromResponse error 3: ${err}`); // saved
    });
  } catch (error) {
    logger.error(`saveCollectionTimestampFromResponse error 4:  ${error}`);
  }
}

const collectionTimestampTask = cron.schedule('* * * * *', async () => {
  try {
    console.log('Collection_Time_series-JOB---');
    const collections = await Collection.find({}, 'symbol name image').catch((e) => {
      logger.error(`Collection_Time_series-JOB error: ${e}`);
    });
    collections.forEach(async (it) => {
      const config = {
        url: String(`https://api-mainnet.magiceden.dev/rpc/getCollectionEscrowStats/${it.symbol}`),
        httpsAgent: agent,
      };

      axios.request(config)
        .then((resp) => {
          if (resp.code === 'ECONNRESET' || resp.code === 'ERR_SOCKET_CLOSED') throw new Error('An error occured while reaching magiceden api');
          saveCollectionTimestampFromResponse(resp, it.image, it.name).catch((e) => {
            logger.error(`saveCollectionTimestampFromResponse error: ${e}`);
          });
        })
        .catch((error) => {
          logger.error(`collectionTimestampTask error 1: ${error}`);
        });
    });
  } catch (error) {
    logger.error(`collectionTimeStampTask error 2: ${error}`);
  }
});

module.exports = collectionTimestampTask;
