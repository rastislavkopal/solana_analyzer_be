const httpStatus = require('http-status');
const Holder = require('../models/holder.model');
const service = require('../services/collection.service');
const Collection = require('../models/collection.model');
const logger = require('../../config/logger');

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
    logger.error(`holders.controller load()error:${error}`);
    return null;
  }
};

/**
 * Get list of holders
 * @public
*/
exports.listHolders = async (req, res, next) => {
  try {
    if (!req.locals.collection) {
      res.status(httpStatus.NOT_FOUND);
      res.json('Collection not found');
    }

    const { symbol } = req.locals.collection;

    const collectionHolders = await Holder.find({ symbol }, '-_id walletId symbol itemsCount');
    res.json(collectionHolders);
  } catch (error) {
    next(error);
  }
};

/**
 * Number of distinct holders in collection
 * @public
*/
exports.getHoldersCount = async (req, res, next) => {
  try {
    if (!req.locals.collection) {
      res.status(httpStatus.NOT_FOUND);
      res.json('Collection not found');
    }

    const { symbol } = req.locals.collection;

    // find owners of collection where itemsCount is greater than 0
    const collectionHolders = await Holder.find({
      $and: [
        { symbol },
        { itemsCount: { $gt: 0 } },
      ],
    });
    res.json({
      symbol,
      count: collectionHolders.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get list of whales
 * @public
*/
exports.getWhalesList = async (req, res, next) => {
  try {
    if (!req.locals.collection) {
      res.status(httpStatus.NOT_FOUND);
      res.json('Collection not found');
    }

    let limit = 20;
    let treshold = 20;

    if (req.query.limit) limit = req.query.limit;
    if (req.query.treshold) treshold = req.query.treshold;

    const { symbol } = req.locals.collection;

    const collectionHolders = await Holder.find({
      $and: [
        { symbol },
        { itemsCount: { $gt: treshold } },
      ],
    }, '-_id walletId itemsCount').limit(limit);
    res.json(collectionHolders);
  } catch (error) {
    next(error);
  }
};
