const httpStatus = require('http-status');
const RaritySheet = require('../models/raritySheet.model');
const service = require('../services/collection.service');
const Collection = require('../models/collection.model');
const Attributes = require('../models/attributes.model');
const logger = require('../../config/logger');

/**
 * Load collection and append to req.
 * @public
 */

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
    // eslint-disable-next-line max-len
    const ret = await service.updateCollectionRarity(req.body.raritySymbol, req.body.collectionSymbol);
    console.log(JSON.stringify(ret));
    if (!ret) {
      res.status(httpStatus.NOT_FOUND);
      res.json('Collection not found');
    }

    res.status(httpStatus.CREATED);
    res.json(ret);
  } catch (error) {
    next(error);
  }
};

exports.removeCollectionRarity = async (req, res, next) => {
  try {
    // eslint-disable-next-line max-len
    const ret = await service.removeCollectionRarityIfNotExists(req.body.raritySymbol, req.body.collectionSymbol);

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
exports.getRarityItems = async (req, res, next) => {
  try {
    if (!req.locals.collection) {
      res.status(httpStatus.BAD_REQUEST);
      res.json('Collection not found.');
    }
    const { collection } = req.locals;
    const { symbol } = collection;
    const { percentage } = req.params;
    const query = await Attributes.find({ collectionSymbol: symbol });
    // console.log(JSON.stringify(query));
    const { attributes } = query;
    const resp = [];
    attributes.forEach((attribute) => {
      if (attribute.rarity <= percentage) resp.push(attribute.value);
    });
    res.json(resp);
  } catch (error) {
    next(error);
  }
};
exports.listRaritySheets = async (req, res, next) => {
  try {
    const collections = await RaritySheet.find({});
    const resp = [];
    collections.forEach((collection) => {
      const transformed = collection;
      transformed.items = null;
      resp.push(transformed);
    });
    res.json(resp);
  } catch (error) {
    next(error);
  }
};
