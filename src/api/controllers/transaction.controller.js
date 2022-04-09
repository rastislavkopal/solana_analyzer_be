const Collection = require('../models/collection.model');
const Item = require('../models/item.model');
const Transaction = require('../models/transaction.model');
const logger = require('../../config/logger');

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
    let { number } = req.params;
    const { symbol } = req.params;
    // testing purposes only
    // await Transaction.remove({}).exec();
    if (number > 20) number = 20;
    const transactions = await Transaction.find({
      collectionSymbol: symbol,
    }).sort({ price: -1 })
      .limit(Number(number))
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
exports.getLastSales = async (req, res, next) => {
  try {
    let { number } = req.params;
    const { symbol } = req.params;
    if (number > 20) number = 20;

    const transactions = await Transaction.find({
      collectionSymbol: symbol.toLowerCase(),
    }).sort({ createdAt: -1 })
      .limit(Number(number));

    res.setHeader('Content-Type', 'application/json');
    res.json(transactions);
  } catch (error) {
    next(error);
  }
};
