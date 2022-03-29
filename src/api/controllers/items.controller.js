// const httpStatus = require('http-status');
// const axios = require('axios');
// const httpStatus = require('http-status');
// const { response } = require('express');
// const httpStatus = require('http-status');
const axios = require('axios');
const Collection = require('../models/collection.model');
const Item = require('../models/item.model');
const { agent } = require('../utils/proxyGenerator');
// const logger = require('../../config/logger');
// const { agent } = require('../utils/proxyGenerator');
// const CollectionTs = require('../models/collectionTs.model');
// const RaritySheet = require('../models/raritySheet.model');
// const CollectionTs = require('../models/collectionTs.model');

/**
 * Load collection and append to req.
 * @public
 */
exports.load = async (req, res, next, symbol) => {
  try {
    console.log('loading symbol');
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
    const collectionSymbol = req.locals.collection.symbol;
    const items = await Item.find({ collectionSymbol });
    res.setHeader('Content-Type', 'application/json');
    res.json(items);
  } catch (error) {
    next(error);
  }
};
exports.listItemsBellowRank = async (req, res, next) => {
  try {
    const { rank } = req.params;
    const collectionSymbol = req.locals.collection.symbol;
    // eslint-disable-next-line max-len
    const items = await Item.find({ collectionSymbol, rank: { $lte: rank } }).sort({ listedFor: 1 }).limit(5);
    res.setHeader('Content-Type', 'application/json');
    res.json(items);
  } catch (error) {
    next(error);
  }
};
exports.test = async (req, res, next) => {
  try {
    console.log(`symb: ${req.params.symbol}`);
    const t = encodeURIComponent(`{"$match":{"collectionSymbol":"${req.params.symbol}"},"$sort":{"takerAmount":1,"createdAt":-1},"$skip":500,"$limit":500,"status":["all"]}`);
    const config = {
      url: `https://api-mainnet.magiceden.io/rpc/getListedNFTsByQuery?q=${t}`,
      httpsAgent: agent,
    };
    console.log(`URL: ${config.url}`);
    axios.request(config).then((response) => {
      const { results } = response.data;
      console.log(results[0]);
      res.setHeader('Content-Type', 'application/json');
      res.json(results.length);
    });
  } catch (error) {
    next(error);
  }
};
