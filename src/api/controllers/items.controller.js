// const httpStatus = require('http-status');
const axios = require('axios');
const httpStatus = require('http-status');
const { response } = require('express');
const Collection = require('../models/collection.model');
const Item = require('../models/item.model');
// const logger = require('../../config/logger');
const { agent } = require('../utils/proxyGenerator');
const CollectionTs = require('../models/collectionTs.model');

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
 * Get collections list
 * @public
 */
exports.listItems = async (req, res, next) => {
  try {
    const { symbol } = req.locals.collection.symbol;
    const collection = await Collection.find({ symbol });

    const item = await Item.find({ collectionId: collection[0]._id });
    res.setHeader('Content-Type', 'application/json');
    res.json(item);
  } catch (error) {
    next(error);
  }
};

/**
 * Listings price distribution data
 * @public
 */
exports.getListingPriceDistribution = async (req, res, next) => {
  try {
    const { symbol } = req.params;
    let config = {
      url: String(`http://localhost:3000/v1/collection/${symbol}/history/complete`),
      httpsAgent: agent,
    };
    const resp = await axios.request(config);

    if (resp.status !== 200 || !resp.data) {
      res.setHeader('Content-Type', 'application/json');
      res.json('Unable to get');
      return;
    }

    const { listedCount } = resp.data[0].metadata;
    if (listedCount > 500) {
      // Add more unsupported cases ( E.g. cooldown on this function )
      res.setHeader('Content-Type', 'application/json');
      res.json('Collection of this size is unsupported.');
      return;
    }

    const iterations = Math.ceil(listedCount / 20);
    const remainder = listedCount % 20;
    let index = 0;
    let step = remainder;
    const concatData = {};
    const requestsPrice = [];
    const ids = [];
    for (let i = 0; i < iterations; i += 1) {
      config = {
        url: String(`https://api-mainnet.magiceden.io/rpc/getListedNFTsByQuery?q={"$match":{"collectionSymbol":"${symbol}"},"$sort":{"takerAmount":1,"createdAt":-1},"$skip":${index},"$limit":${step}}`),
        httpsAgent: agent,
      };
      requestsPrice.push(axios.request(config)
        .then((priceResponse) => {
          if (priceResponse.status === 200) {
            const { results } = priceResponse.data;
            results.forEach(async (it) => {
              ids.push(it.mintAddress);
              concatData[it.mintAddress] = {
                price: it.price,
                listedFor: null,
              };
            });
          }
        })
        .catch((error) => { throw error; }));
      index += step;
      step = 20;
    }

    Promise.allSettled(requestsPrice)
      .then(() => {
        const requestsPeriod = [];
        ids.forEach(async (id) => {
          config = {
            url: String(`https://api-mainnet.magiceden.io/rpc/getGlobalActivitiesByQuery?q={"$match":{"mint":"${id}"},"$sort":{"blockTime":-1,"createdAt":-1},"$skip":0}`),
            httpsAgent: agent,
          };
          requestsPeriod.push(
            axios.request(config)
              .then((periodResponse) => {
                const { results } = periodResponse.data;
                results.every((it) => {
                  // can't be async - we are looking at the first occurence of 'initializeEscrow'
                  if (it.txType === 'initializeEscrow') {
                    const timeDiff = (new Date(Date.now()) - Date.parse(it.createdAt));
                    const inHours = Number(timeDiff / 3600000).toFixed(2);
                    if (inHours < 1) concatData[it.mint].listedFor = '< 1 hour';
                    else concatData[it.mint].listedFor = `${inHours} hours`;
                    return false;
                  }
                  return true;
                });
              })
              .catch((error) => { throw error; }),
          );
        });
        Promise.allSettled(requestsPeriod)
          .then(() => {
            res.setHeader('Content-Type', 'application/json');
            res.json(concatData);
          })
          .catch((error) => { throw error; });
      })
      .catch((error) => { throw error; });
  } catch (error) {
    next(error);
  }
};
