const axios = require('axios');
const { agent } = require('../utils/proxyGenerator');
const Collection = require('../models/collection.model');

/**
 * Create collection if does not already exists
 * @public
 */
exports.createCollectionIfNotExists = async (collectionId) => {
  const config = {
    url: String(`https://api-mainnet.magiceden.io/collections/${collectionId}`),
    httpsAgent: agent,
  };

  const collectionRes = await axios.request(config);

  const {
    symbol, description, image, name, totalItems,
  } = collectionRes.data;

  if (symbol) {
    const res = await Collection.findOne({ symbol });
    if (!res) {
      const newCollection = new Collection({
        symbol,
        market_name: 'https://magiceden.io/',
        name,
        totalItems,
        description,
        image,
      });
      console.log('to be created');
      return newCollection.save();
    }
    console.log('Collection already exists');
    return res;
  }
  console.log('Fetched collection response is null.');
  return null;
};
