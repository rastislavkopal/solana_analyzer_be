const cron = require('node-cron');
const axios = require('axios');
const Collection = require('../../models/collection.model');
const CollectionTs = require('../../models/collectionTs.model');
const logger = require('../../../config/logger');
const { agent } = require('../../utils/proxyGenerator');
const CollectionService = require('../../services/collection.service');

function calculateChange(collectionTS_now, collectionsTS_24hBefore, option) {
  if (typeof collectionsTS_24hBefore.metadata.floorPrice === 'undefined' || typeof collectionsTS_24hBefore.metadata.listedCount ){
    return "NaN";
  }
  let val_now;
  let val_before;
  let change;
  if (option === "floorPrice"){
    val_now = collectionTS_now.metadata.floorPrice
    val_before = collectionsTS_24hBefore.metadata.floorPrice
  }
  else if (option === "listedCount"){
    val_now = collectionTS_now.metadata.listedCount
    val_before = collectionsTS_24hBefore.metadata.listedCount
  }
  else {
    console.log("Invalid option in calculateChange() selected.")
    return "";
  }
  if (val_now == val_before) return "0%"
  else if( val_now > val_before){
    change = val_now / val_before * 100
  }
  else change = -(val_now / val_before * 100)

  return change+"%";
}

async function saveCollectionTimestampFromResponse(resp,image,name) {
  try {
    if (resp.status !== 200 || Object.keys(resp.data).length === 0) throw new Error('An error occured while fetching data.');
    const { results } = resp.data;
    const now = new Date(Date.now()).toISOString();
    const now6min = new Date(Date.now() - (360 * 1000)).toISOString();
    const before24h = new Date(Date.now() - (3600 * 1000 * 24)).toISOString();

    const collectionTS_now = CollectionTs.findOne({"metadata.symbol": results.symbol, timestamp: { $gte: now6min}})
    const collectionsTS_24hBefore = await CollectionTs.findOne({ timestamp: { $gte: before24h } });
    const floorPriceChange = calculateChange(collectionTS_now,collectionsTS_24hBefore, "floorPrice");
    const listedCountChange = calculateChange(collectionTS_now,collectionsTS_24hBefore, "listedCount");

    const timestamp = new CollectionTs({
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
      if (err) logger.error(`collectionTimestampTask: ${err}`); // saved
    });
  } catch (error) {
    logger.error(`collectionTimestampTask:  ${error}`);
  }
}

const updateItemsTask = cron.schedule('*/5 * * * *', async () => {
  try {
    console.log('Collection_Time_series-JOB---');
    const collections = await Collection.find({}, 'symbol name image');
    collections.forEach(async (it) => {
      const config = {
        url: String(`https://api-mainnet.magiceden.io/rpc/getCollectionEscrowStats/${it.symbol}`),
        httpsAgent: agent,
      };

      axios.request(config)
        .then((resp) => {
          saveCollectionTimestampFromResponse(resp,it.image,it.name);
        })
        .catch((error) => { throw error; });
    });
  } catch (error) {
    logger.error(`${error}`);
  }
});

module.exports = updateItemsTask;
