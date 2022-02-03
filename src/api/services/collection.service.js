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
  console.log(collectionRes.data);
  const {
    symbol, description, image, name, totalItems,
  } = collectionRes.data;

  if (symbol) {
    const res = await Collection.findOne({ collection_name_id: symbol });
    if (!res) {
      const newCollection = new Collection({
        collection_name_id: symbol,
        market_name: 'https://magiceden.io/',
        collection_full_name: name,
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
  console.log('is null');
  return null;
};