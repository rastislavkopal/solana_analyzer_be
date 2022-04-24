const cron = require('node-cron');
const axios = require('axios');
const logger = require('../../../config/logger');
const { agent } = require('../../utils/proxyGenerator');
const Transaction = require('../../models/transaction.model');
const Collection = require('../../models/collection.model');
const CollectionService = require('../../services/collection.service');
const Holder = require('../../models/holder.model');

// # ┌────────────── second (optional)
// # │ ┌──────────── minute
// # │ │ ┌────────── hour
// # │ │ │ ┌──────── day of month
// # │ │ │ │ ┌────── month
// # │ │ │ │ │ ┌──── day of week
// # │ │ │ │ │ │
// # │ │ │ │ │ │
// # * * * * * *

async function saveTransactions(concatData, collectionSymbol, walletIDs) {
  const transactionSignatures = Array.from(concatData.keys());
  const existingTransactionsQuery = await Transaction.find({ signature: transactionSignatures })
    .catch((e) => {
      logger.error(`saveTransactions error: ${e}`);
    });
  const existingTransactions = existingTransactionsQuery
    .map((transaction) => transaction.signature);
  const newTransactions = transactionSignatures.filter((x) => !existingTransactions.includes(x));

  if (newTransactions.length > 0) {
    const isWhaleMap = new Map();
    const holders = await Holder.find({ walletId: walletIDs, symbol: collectionSymbol })
      .catch((e) => {
        logger.error(`saveTransactions error 2: ${e}`);
      });
    holders.forEach((it) => {
      isWhaleMap.set(it.walletId, it.isWhale);
    });
    const items = Array.from(concatData.entries(), ([key, value]) => {
      const rObj = {
        updateOne: {
          filter: { signature: key },
          update: {
            $set: {
              signature: key,
              mintAddress: value.tokenMint,
              collectionSymbol,
              price: value.price,
              buyer: value.buyer,
              seller: value.seller,
              isWhale: isWhaleMap.get(value.buyer),
            },
          },
          upsert: true,
        },
      };
      return rObj;
    });
    await Transaction.bulkWrite(items, { ordered: false }).catch((e) => {
      logger.error(`saveTransactions error 3: ${e}`);
    });
  }
}

async function getBuyTransactions(symbol, offset = 0, limit = 30) {
  try {
    const collection = await Collection.findOne({ symbol }).catch((e) => {
      logger.error(`getBuyTransactions error 1: ${e}`);
    });
    const concatData = new Map();
    const walletIDs = [];
    const config = {
      url: String(
        `https://api-mainnet.magiceden.dev/v2/collections/${symbol}/activities?offset=${offset}&limit=${limit}`,
      ),
      httpsAgent: agent,
    };
    await axios.request(config)
      .then((response) => {
        if (response.code === 'ECONNRESET' || response.code === 'ERR_SOCKET_CLOSED') {
          throw new Error('An error occured while reaching magiceden api');
        }
        response.data.forEach((transaction) => {
          if (transaction.type === 'buyNow') {
            concatData.set(transaction.signature, transaction);
            walletIDs.push(transaction.buyer);
          }
        });
        saveTransactions(concatData, collection.symbol, walletIDs);
      }).catch((e) => {
        logger.error(`getBuyTransactions error 2: ${e}`);
      });
  } catch (error) {
    logger.error(`getBuyTransactions error 3: ${error}`);
  }
}

// Runs every 10 seconds
const getBuyTransactionsTask = cron.schedule('*/10 * * * * *', async () => {
  console.log('Transaction-JOB---');
  const activeCollections = await CollectionService.loadActive().catch((e) => {
    logger.error(`getBuyTransactionsTask loadActive error: ${e}`);
  });
  if (activeCollections && Object.keys(activeCollections).length > 0) {
    activeCollections.forEach((symbol) => {
      getBuyTransactions(symbol);
    });
  }
});

module.exports = getBuyTransactionsTask;
