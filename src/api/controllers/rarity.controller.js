const httpStatus = require('http-status');
const RaritySheet = require('../models/raritySheet.model');
const service = require('../services/collection.service');
const Collection = require('../models/collection.model');

/**
 * Load collection and append to req.
 * @public
 */
exports.load = async (req, res, next, raritySymbol) => {
  try {
    const collection = await Collection.findOne({ raritySymbol }).exec();
    console.log(collection);
    req.locals = { collection };
    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Get collections rarity
 * @public
*/
exports.getCollectionRaritySheet = async (req, res, next) => {
  try {
    const { raritySymbol } = req.locals.collection;
    const raritySheet = await RaritySheet.find({ raritySymbol });
    res.json(raritySheet);
  } catch (error) {
    next(error);
  }
};

exports.addCollectionRarity = async (req, res, next) => {
  try {
    const { _id, raritySymbol } = req.locals.collection;

    const ret = await service.updateCollectionRarity(_id, raritySymbol);

    if (!ret) {
      res.status(httpStatus.NOT_FOUND);
      res.json('collection not found');
    }

    res.status(httpStatus.CREATED);
    res.json(ret);
  } catch (error) {
    next(error);
  }
};

exports.removeCollectionRarity = async (req, res, next) => {
  try {
    const ret = await service.removeCollectionRarityIfNotExists(req.locals.collection.symbol);

    if (!ret) {
      res.status(httpStatus.NOT_FOUND);
      res.json('Resource does not exists');
    }

    res.status(httpStatus.ACCEPTED);
    res.json(ret);
  } catch (error) {
    next(error);
  }
};

exports.listRaritySheets = async (req, res, next) => {
  try {
    const collections = await RaritySheet.find({});
    const resp = [];
    collections.forEach((collection) => {
      resp.push(collection.transform());
    });
    res.json(resp);
  } catch (error) {
    next(error);
  }
};
