const axios = require('axios');
const Collection = require('../models/collection.model');
const Item = require('../models/item.model');
const { agent } = require('../utils/proxyGenerator');

exports.load = async (req, res, next, symbol) => {
  try {
    const collection = await Collection.findOne({ symbol }).exec();

    req.locals = { collection };
    return next();
  } catch (error) {
    return next(error);
  }
};

exports.getLastBigSales = async (req, res, next) => {
  try {
    const { collection } = req.locals;
    const { number } = req.params;
    const { symbol } = collection;
    const response = [];
    const config = {
      url: String(
        // `api-mainnet.magiceden.dev/v2/collections/${symbol}/activities?offset=0&limit=500`,
        `https://api-mainnet.magiceden.dev/v2/collections/${symbol}/activities?offset=0&limit=500`,
      ),
      httpsAgent: agent,
    };
    await axios.request(config).then(async (transactionResponse) => {
      transactionResponse.data.forEach((transaction) => {
        if (transaction.type === 'buyNow') {
          response.push(transaction.tokenMint);
        }
      });
      response.sort((a, b) => b[1] - a[1])
        .splice(number);
      const items = await Item.find({
        collectionId: collection._id,
        mintAddress: response,
      }).exec();
      res.setHeader('Content-Type', 'application/json');
      res.json(items);
    });
  } catch (error) {
    return next(error);
  }
};
