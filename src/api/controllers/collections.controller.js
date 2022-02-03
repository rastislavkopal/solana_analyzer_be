const httpStatus = require('http-status');
const Collection = require('../models/collection.model');
const service = require('../services/collection.service');

/**
 * Get Solanart collections list
 * @public
 */
exports.listCollections = async (req, res, next) => {
  try {
    const collections = await Collection.find({});
    res.setHeader('Content-Type', 'application/json');
    res.json(collections);
  } catch (error) {
    next(error);
  }
};

/**
 * Add new collection
 * @public
 */
exports.addCollection = async (req, res, next) => {
  try {
    const ret = await service.createCollectionIfNotExists(req.body.collectionId);

    if (ret) {
      res.status(httpStatus.CREATED);
      res.json(ret);
    } else {
      res.status(httpStatus.NOT_FOUND);
      res.json('collection not found');
    }
  } catch (error) {
    next(error);
  }
};
