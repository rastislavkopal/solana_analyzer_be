const axios = require('axios');
const Collection = require('../models/collection.model');
const Item = require('../models/item.model');
const Transaction = require('../models/transaction.model');
const Holder = require('../models/holder.model');
const { agent } = require('../utils/proxyGenerator');

exports.load = async (req, res, next, symbol) => {
  try {
    const collection = await Collection.findOne({ symbol }).exec();

    req.locals = { collection };
    return next();
  } catch (error) {
    return next(error);
  }
};
exports.getLastBigSales = async (req, res, next) => {
  try {
    const { collection } = req.locals;
    const { number } = req.params;
    // testing purposes only
    // await Transaction.remove({}).exec();
    const transactions = await Transaction.find({
      collectionId: collection._id,
    }).sort({ price: -1 })
      // .limit(Number(number))
      .exec();

    const items = await Item.find({
      collectionId: collection._id,
      mintAddress: transactions.map((item) => item.mintAddress),
    })
      .sort({ listedFor: -1 })
      .exec();

    res.setHeader('Content-Type', 'application/json');
    res.json(items);
  } catch (error) {
    next(error);
  }
};
