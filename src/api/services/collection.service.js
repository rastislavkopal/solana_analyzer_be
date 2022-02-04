// const httpStatus = require('http-status');
// const expressValidation = require('express-validation');
// const APIError = require('../errors/api-error');
// const { env } = require('../../config/vars');
const axios = require('axios');
const Collection = require('../models/collection.model');

/**
 * Catch 404 and forward to error handler
 * @public
 */
exports.createCollectionIfNotExists = async (collectionId) => {
  const collectionRes = await axios.get(`https://api-mainnet.magiceden.io/collections/${collectionId}`);
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
        totalItems, // shorthand syntax
        description,
        image,
      });
      console.log('to be created');
      return newCollection.save();
    }
    console.log('already exists');
    return res;
  }
  console.log('Fetched collection response is null.');
  return null;
};
