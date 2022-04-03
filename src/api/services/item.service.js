const Item = require('../models/item.model');
const logger = require('../../config/logger');

exports.updateItemsFromMap = async (concatData, symbol) => {
  console.log(`Updating items of ${symbol} ...`);
  const items = Array.from(concatData.entries(), ([key, value]) => {
    const rObj = {
      updateOne: {
        filter: { mintAddress: key },
        update: {
          $set: {
            mintAddress: key,
            collectionSymbol: symbol,
            forSale: true,
            price: value.price,
            img: value.img,
          },
        },
        upsert: true,
      },
    };
    return rObj;
  });
  Item.bulkWrite(items);
};
exports.updateItemsFromRarityMap = async (concatData) => {
  console.log('Updating items from rarity map....');
  const items = Array.from(concatData.entries(), ([key, value]) => {
    const rObj = {
      mintAddress: key,
      attributes: value.itemAttr,
      rank: value.itemRank,
      name: value.itemName,
    };
    return rObj;
  });
  Item.upsertMany(items).then(() => {}).catch((err) => { logger.error(`updateItemsFromData: ${err}`); });
};
