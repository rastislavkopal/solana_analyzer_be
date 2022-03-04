const cron = require('node-cron');
const axios = require('axios');
// const mongoose = require('mongoose');
const logger = require('../../../config/logger');
const { agent } = require('../../utils/proxyGenerator');
const Transaction = require('../../models/transaction.model');
const Collection = require('../../models/collection.model');
const Holder = require('../../models/holder.model');

const collectionSymbolList = ['888_anon_club'];
// # ┌────────────── second (optional)
// # │ ┌──────────── minute
// # │ │ ┌────────── hour
// # │ │ │ ┌──────── day of month
// # │ │ │ │ ┌────── month
// # │ │ │ │ │ ┌──── day of week
// # │ │ │ │ │ │
// # │ │ │ │ │ │
// # * * * * * *

async function saveTransaction(transaction, collectionId) {
  const holder = await Holder.findOne({ collectionId, walletId: transaction.buyer }).exec();
  let isWhale = false;
  if (holder != null && holder.itemsCount > 7) {
    isWhale = true;
  }
  const newTransaction = new Transaction({
    signature: transaction.signature,
    mintAddress: transaction.tokenMint,
    buyer: transaction.buyer,
    seller: transaction.seller,
    price: transaction.price,
    transactionType: transaction.type,
    collectionId,
    isWhale,
  });
  return newTransaction.save();
}

async function getBuyTransactions(symbol, offset = 0, limit = 500) {
  try {
    const collection = await Collection.findOne({ symbol })
      .exec();
    const config = {
      url: String(
        `https://api-mainnet.magiceden.dev/v2/collections/${symbol}/activities?${offset}=0&limit=${limit}`,
      ),
      httpsAgent: agent,
    };
    await axios.request(config)
      .then((transactionResponse) => {
        transactionResponse.data.forEach((transaction) => {
          if (transaction.type === 'buyNow') {
            saveTransaction(transaction, collection._id);
          }
        });
      });
  } catch (error) {
    logger.error(error);
  }
}

// Updates list of collections and its information every 1 minute
const getBuyTransactionsTask = cron.schedule('* * * * *', async () => {
  console.log('Transaction-JOB---');
  collectionSymbolList.forEach((symbol) => {
    getBuyTransactions(symbol);
  });
});

module.exports = getBuyTransactionsTask;
