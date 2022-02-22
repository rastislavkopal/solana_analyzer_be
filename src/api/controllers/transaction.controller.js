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

async function getBuyTransactions(req, res, next, offset = 0, limit = 500) {
  try {
    const { collection } = req.locals;
    const { symbol } = collection;
    const response = [];
    const config = {
      url: String(
        // `api-mainnet.magiceden.dev/v2/collections/${symbol}/activities?offset=0&limit=500`,
        `https://api-mainnet.magiceden.dev/v2/collections/${symbol}/activities?${offset}=0&limit=${limit}`,
      ),
      httpsAgent: agent,
    };
    await axios.request(config)
      .then(async (transactionResponse) => {
        transactionResponse.data.forEach((transaction) => {
          if (transaction.type === 'buyNow') {
            response.push(
              {
                price: transaction.price,
                mintAddress: transaction.tokenMint,
                buyer: transaction.buyer,
                seller: transaction.seller,
              },
            );
          }
        });
      });
    return response;
  } catch (error) {
    return next(error);
  }
}

exports.getLastBigSales = async (req, res, next) => {
  try {
    const { collection } = req.locals;
    const { number } = req.params;
    const response = await getBuyTransactions(req, res, next);
    response.sort((a, b) => b.price - a.price)
      .splice(number);
    let mintAddrArray = [];
    mintAddrArray = response.map((item) => item.mintAddress);
    const items = await Item.find({
      collectionId: collection._id,
      mintAddress: mintAddrArray,
    })
      .sort({ listedFor: -1 })
      .exec();

    res.setHeader('Content-Type', 'application/json');
    res.json(items);
  } catch (error) {
    next(error);
  }
};
exports.getWhaleTransactions = async (req, res, next) => {

};
