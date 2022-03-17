const httpStatus = require('http-status');
const Collection = require('../models/collection.model');
const CollectionTs = require('../models/collectionTs.model');
const service = require('../services/collection.service');

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
    res.setHeader('Content-Type', 'application/json');
    res.json(collections);
  } catch (error) {
    next(error);
  }
};
exports.collectionStats = async (req, res, next) => {
  try {
    const now = new Date(Date.now()).toISOString();
    const now6min = new Date(Date.now() - (360 * 1000)).toISOString();

    const collectionTS_now = await CollectionTs.find({ timestamp: { $gte: now6min, $lte: now }},'-_id  name metadata timestamp');
    // collection image, symbol, floor price, listed count,volume (24h) floor price change (24h), listed count change (24h)

    res.setHeader('Content-Type', 'application/json');
    res.json(collectionTS_now);
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
      'image', 'creators', 'totalItems', 'category', 'owner_count'];

    fields.forEach((field) => {
      if (req.body[field]) {
        transformed[field] = req.body[field];
      }
    });

    const ret = await Collection.updateOne({ _id: collection._id }, transformed);

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
