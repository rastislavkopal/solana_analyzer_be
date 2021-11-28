// const httpStatus = require('http-status');
const Collection = require('../models/collection.model');

/**
 * Get Solanart collections list
 * @public
 */
exports.listSolanart = async (req, res, next) => {
  try {
    const collections = await Collection.find({});
    res.setHeader('Content-Type', 'application/json');
    res.json(collections);
  } catch (error) {
    next(error);
  }
};
