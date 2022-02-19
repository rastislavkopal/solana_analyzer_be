// const httpStatus = require('http-status');
// const axios = require('axios');
// const httpStatus = require('http-status');
// const { response } = require('express');
// const httpStatus = require('http-status');
const Collection = require('../models/collection.model');
const Item = require('../models/item.model');
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
    const { symbol } = req.locals.collection;
    const collection = await Collection.find({ symbol });

    const items = await Item.find({ collectionId: collection[0]._id });
    res.setHeader('Content-Type', 'application/json');
    res.json(items);
  } catch (error) {
    next(error);
  }
};
