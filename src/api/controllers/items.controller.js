// const httpStatus = require('http-status');
const axios = require('axios');
const Collection = require('../models/collection.model');
const Item = require('../models/item.model');
// const logger = require('../../config/logger');
const { agent } = require('../utils/proxyGenerator');

/**
 * Load collection and append to req.
 * @public
 */
exports.load = async (req, res, next, symbol) => {
  try {
    const collection = await Collection.findOne({ symbol }).exec();
    req.locals = { collection };
    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Get collections list
 * @public
 */
exports.listItems = async (req, res, next) => {
  try {
    const { symbol } = req.locals.collection.symbol;
    const collection = await Collection.find({ symbol });

    const item = await Item.find({ collectionId: collection[0]._id });
    res.setHeader('Content-Type', 'application/json');
    res.json(item);
  } catch (error) {
    next(error);
  }
};

/**
 * Listings price distribution data
 * @public
 */
exports.getListingPriceDistribution = async (req, res, next) => {
  try {
    // const { collection } = req.locals;
    const { symbol } = req.params;
    const config = {
      url: String(`https://api-mainnet.magiceden.io/rpc/getListedNFTsByQuery?q={"$match":{"collectionSymbol":"${symbol}"}}`),
      httpsAgent: agent,
    };

    const resp = await axios.request(config);

    if (resp.status !== 200 || !resp.data) {
      res.setHeader('Content-Type', 'application/json');
      res.json('Unable to get');
      return;
    }

    const { results } = resp.data;

    const transData = {};

    results.forEach((it) => {
      const timeDiff = (new Date(Date.now()) - (new Date(it.createdAt)));
      transData[it.id] = {
        price: it.price,
        period: Math.floor(timeDiff / 60e3),
      };
    });

    res.setHeader('Content-Type', 'application/json');
    res.json(transData);
  } catch (error) {
    next(error);
  }
};
