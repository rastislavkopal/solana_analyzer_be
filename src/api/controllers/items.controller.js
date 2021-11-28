// const httpStatus = require('http-status');
// const axios = require('axios');
const Collection = require('../models/collection.model');
const Item = require('../models/item.model');
const logger = require('../../config/logger');

/**
 * Load collection and append to req.
 * @public
 */
exports.load = async (req, res, next, collectionNameId) => {
  try {
    const collection = await Collection.find({ collection_name_id: collectionNameId });
    req.locals = { collection };
    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Get Solanart collections list
 * @public
 */
exports.listItems = async (req, res, next) => {
  try {
    const colectionName = req.locals.collection[0].collection_name_id;
    const collection = await Collection.find({ collection_name_id: colectionName });

    const item = await Item.find({ collectionId: collection[0]._id });
    res.setHeader('Content-Type', 'application/json');
    res.json(item);
  } catch (error) {
    next(error);
  }
};
