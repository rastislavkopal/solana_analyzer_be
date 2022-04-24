const httpStatus = require('http-status');
const Collection = require('../models/collection.model');
const CollectionTs = require('../models/collectionTs.model');
const service = require('../services/collection.service');
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
    return next(error);
  }
};

/**
 * Get collection by symbol
 * @public
 */
exports.getCollection = async (req, res, next) => {
  try {
    console.log('Im here.');
    if (!req.locals.collection) {
      res.status(httpStatus.BAD_REQUEST);
      res.json('Collection not found.');
    }

    Collection.findOne({ symbol: req.locals.collection.symbol }, (err, collection) => {
      if (err) {
        res.status(httpStatus.INTERNAL_SERVER_ERROR);
        res.json('Unexpected error occurred.');
      }
      if (!collection) {
        res.status(httpStatus.NOT_FOUND);
        res.json('collection not found');
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.json(collection);
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get collections list
 * @public
 */
exports.listCollections = async (req, res, next) => {
  try {
    const collections = await Collection.find({});
    res.json(collections);
  } catch (error) {
    next(error);
  }
};

exports.collectionStats = async (req, res, next) => {
  try {
    // const now = new Date(Date.now()).toISOString();
    // const now1min = new Date(Date.now() - (60 * 1000)).toISOString();
    // eslint-disable-next-line max-len
    // const collectionTS_now = await CollectionTs.find({ timestamp: { $gt: now5min, $lte: now }},'-_id  name metadata timestamp');
    const collectionTsNow = await CollectionTs.find({ recent: true }).sort('floorPrice');
    /*
    const returnArr = [];
    const compareArr = [];
    collectionTsNow.forEach((collectionTs) => {
      if (!compareArr.includes(collectionTs.metadata.symbol)) {
        compareArr.push(collectionTs.metadata.symbol);
        returnArr.push(collectionTs);
      }
    });
     */
    res.json(collectionTsNow);
  } catch (error) {
    next(error);
  }
};
exports.removeCollections = async (req, res, next) => {
  try {
    const collections = await Collection.remove({});
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
    console.log(req.body);

    const ret = await service.createCollectionIfNotExists(req.body.symbol, req.body.raritySymbol);

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
 * Get historical data for collection
 * @public
 */
exports.getCollectionHistoryComplete = async (req, res, next) => {
  try {
    let limit = 100;
    let dense = 1;

    if (req.query.limit) limit = req.query.limit;
    if (req.query.dense) dense = req.query.dense;

    const { collection } = req.locals;
    if (!collection) {
      res.status(httpStatus.NOT_FOUND);
      res.json('Collection not found');
      return;
    }

    const collectionTs = await CollectionTs.find({ 'metadata.symbol': collection.symbol }, '-_id metadata timestamp')
      .sort({ timestamp: -1 }).limit(limit * dense);

    const densedHistory = [];
    for (let i = 0; (i < limit * dense) && (i < collectionTs.length); i += 1) {
      if (i % dense === 0) densedHistory.push(collectionTs[i]);
    }

    res.setHeader('Content-Type', 'application/json');
    res.json(densedHistory);
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

/**
 * Update selected collection
 * @public
 */
exports.updateCollection = async (req, res, next) => {
  try {
    const { collection } = req.locals;

    if (!collection) {
      res.status(httpStatus.NOT_FOUND);
      res.json('Collection not found');
      return;
    }

    const transformed = collection;
    // update-able fields
    const fields = ['raritySymbol', 'market_name', 'name', 'description',
      'image', 'creators', 'totalItems', 'category', 'owner_count', 'active'];

    fields.forEach((field) => {
      if (req.body[field]) {
        transformed[field] = req.body[field];
      }
    });

    const ret = await Collection.updateOne({ _id: collection._id }, transformed).catch((e) => {
      logger.error(`updateCollection error 1: ${e}`);
    });

    if (transformed.raritySymbol) {
      service.updateCollectionRarity(transformed.raritySymbol, collection.symbol).catch((e) =>{
        logger.error(`updateCollection error 2: ${e}`);
      });
    }

    if (ret.modifiedCount !== 0) {
      res.status(httpStatus.CREATED);
      res.json(transformed);
    } else {
      res.status(httpStatus.NOT_FOUND);
      res.json('collection not found');
    }
  } catch (error) {
    next(error);
  }
};
