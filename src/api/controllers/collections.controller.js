const httpStatus = require('http-status');
const Collection = require('../models/collection.model');
const RaritySheet = require('../models/raritySheet.model');
const CollectionTs = require('../models/collectionTs.model');
const service = require('../services/collection.service');

/**
 * Load collection and append to req.
 * @public
 */
exports.load = async (req, res, next, body) => {
  try {
    const collection = await Collection.findOne({
      symbol: body.symbol,
      rarity_symbol: body.rarity_symbol,
    }).exec();

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
exports.listCollection = async (req, res, next) => {
  try {
    const collections = await Collection.find({ symbol: req.body.symbol });
    res.setHeader('Content-Type', 'application/json');
    res.json(collections);
  } catch (error) {
    next(error);
  }
};
exports.listAllCollections = async (req, res, next) => {
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
    const ret = await service.createCollectionIfNotExists(req.body);

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
/**
 * Get collections rarity
 * @public
 */
exports.getCollectionRaritySheet = async (req, res, next) => {
  try {
    const raritySheet = await RaritySheet.find(req.body.collectionId);
    res.setHeader('Content-Type', 'application/json');
    res.json(raritySheet);
  } catch (error) {
    next(error);
  }
};
exports.addCollectionRarity = async (req, res, next) => {
  try {
    // eslint-disable-next-line max-len
    const ret = await service.addCollectionRarityIfNotExists(req.body.collectionId, req.body.collectionName);

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
exports.removeCollectionRarity = async (req, res, next) => {
  try {
    const ret = await service.removeCollectionRarityIfNotExists(req.body.collectionId);

    if (ret) {
      res.status(httpStatus.ACCEPTED);
      res.json(ret);
    } else {
      res.status(httpStatus.NOT_FOUND);
      res.json('Already deleted');
    }
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
    res.setHeader('Content-Type', 'application/json');
    res.json(resp);
  } catch (error) {
    next(error);
  }
};
/**
 * Get historical data for collection
 * @public
 */
exports.getCollectionHistoryComplete = async (req, res, next) => {
  try {
    let limit = 100;

    if (req.query.limit) limit = req.query.limit;

    const { collection } = req.locals;
    if (!collection) {
      res.status(httpStatus.NOT_FOUND);
      res.json('Collection not found');
      return;
    }

    const collectionTs = await CollectionTs.find({ 'metadata.symbol': collection.symbol }, '-_id metadata timestamp')
      .sort({ timestamp: -1 }).limit(limit);
    res.setHeader('Content-Type', 'application/json');
    res.json(collectionTs);
  } catch (error) {
    next(error);
  }
};

exports.getCollectionHistoryFloor = async (req, res, next) => {
  try {
    let limit = 100;

    if (req.query.limit) limit = req.query.limit;

    const { collection } = req.locals;

    if (!collection) {
      res.status(httpStatus.NOT_FOUND);
      res.json('Collection not found');
      return;
    }
    const collectionTs = await CollectionTs.find({ 'metadata.symbol': collection.symbol }, '-_id metadata timestamp')
      .sort({ timestamp: -1 }).limit(limit);

    const history = [];
    collectionTs.forEach((it) => {
      history.push({
        timestamp: (new Date(it.timestamp)).toISOString(),
        value: it.metadata.floorPrice,
      });
    });

    res.setHeader('Content-Type', 'application/json');
    res.json(history);
  } catch (error) {
    next(error);
  }
};

exports.getCollectionHistoryListings = async (req, res, next) => {
  try {
    let limit = 100;

    if (req.query.limit) limit = req.query.limit;

    const { collection } = req.locals;

    if (!collection) {
      res.status(httpStatus.NOT_FOUND);
      res.json('Collection not found');
      return;
    }
    const collectionTs = await CollectionTs.find({ 'metadata.symbol': collection.symbol }, '-_id metadata timestamp')
      .sort({ timestamp: -1 }).limit(limit);

    const history = [];
    collectionTs.forEach((it) => {
      history.push({
        timestamp: (new Date(it.timestamp)).toISOString(),
        listedCount: it.metadata.listedCount,
      });
    });

    res.setHeader('Content-Type', 'application/json');
    res.json(history);
  } catch (error) {
    next(error);
  }
};
