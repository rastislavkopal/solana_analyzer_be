const cron = require('node-cron');
const axios = require('axios');
const mongoose = require('mongoose');
const Item = require('../../models/item.model');
const Collection = require('../../models/collection.model');
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

// Updates list of collections and its information every 1 minute
const updateItemsTask = cron.schedule('*/1 * * * **', async () => {
  try {
    // get and update collections and their basic info
    const collections = await Collection.find(
      {
        $or: [
          { collection_name_id: 'degenape' },
          { collection_name_id: 'aurory' },
          { collection_name_id: 'solpunks' },
          { collection_name_id: 'boldbadgers' },
          { collection_name_id: 'frakt' },
        ],
      },
    ).limit(5);
    collections.forEach((collection) => {
      axios
        .get(`https://qzlsklfacc.medianetwork.cloud/nft_for_sale?collection=${collection.collection_name_id}`)
        .then((response) => {
          const items = response.data.map((item) => {
            const rObj = {
              item_api_id: item.id,
              item_name: item.name,
              token_add: item.token_add,
              seller_address: item.seller_address,
              price: item.price,
              for_sale: item.for_sale,
              attributes: item.attributes,
              skin: item.skin,
              ranking: item.ranking,
              last_sold_price: item.lastSoldPrice,
              collectionId: mongoose.Types.ObjectId(collection._id),
            };
            return rObj;
          });
          Item.upsertMany(items).then(() => {}).catch((err) => { console.log(err); });
        });
    });
  } catch (error) {
    logger.error(error);
  }

  // logger.info(`Updated collections info: ${collections.length} .. items`);
});

module.exports = updateItemsTask;