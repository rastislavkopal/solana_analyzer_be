const Item = require('../models/item.model');
const logger = require('../../config/logger');

exports.updateItemsFromMap = async (concatData, symbol) => {
  console.log('Updating items....');
  const items = Array.from(concatData.entries(), ([key, value]) => {
    const rObj = {
      mintAddress: key,
      rank: value.rank,
      forSale: true,
      collectionId: value.collectionId,
      name: value.name,
      collectionSymbol: symbol,
      price: value.price,
    };
    return rObj;
  });
  Item.upsertMany(items).then(() => {}).catch((err) => { logger.error(`updateItemsFromData: ${err}`); });
}
