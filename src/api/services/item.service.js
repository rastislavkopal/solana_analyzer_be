const axios = require('axios');
const Item = require('../models/item.model');
const logger = require('../../config/logger');
const { agent } = require('../utils/proxyGenerator');

exports.updateItemsFromMap = async (concatData, symbol) => {
  console.log(`Updating items of ${symbol} ...`);
  const items = Array.from(concatData.entries(), ([key, value]) => {
    const rObj = {
      updateOne: {
        filter: { mintAddress: key },
        update: {
          $set: {
            mintAddress: key,
            collectionSymbol: symbol,
            forSale: true,
            price: value.price,
            img: value.img,
          },
        },
        upsert: true,
      },
    };
    return rObj;
  });
  Item.bulkWrite(items).catch((err) => {
    logger.error(`updateItemsFromMap of ${symbol} error: ${err}`);
  });
};
exports.updateItemsFromRarityMap = async (concatData) => {
  console.log('Updating items from rarity map....');
  const items = Array.from(concatData.entries(), ([key, value]) => {
    const rObj = {
      mintAddress: key,
      attributes: value.itemAttr,
      rank: value.itemRank,
      name: value.itemName,
    };
    return rObj;
  });
  Item.upsertMany(items).then(() => {}).catch((err) => { logger.error(`updateItemsFromData: ${err}`); });
};
exports.updateForSale = async (allIDs, symbol) => {
  const itemsResult = await Item.find({ mintAddress: allIDs, collectionSymbol: symbol })
    .catch((err) => {
      logger.error(`itemsResult error: ${err}`);
    });
  const itemsResultArray = itemsResult.map((item) => item.mintAddress);

  const allItemsResult = await Item.find({ collectionSymbol: symbol })
    .catch((err) => {
      logger.error(`allItemsResult error: ${err}`);
    });
  const allItemsArray = allItemsResult.map((item) => item.mintAddress);

  const difference = allItemsArray.filter((x) => !itemsResultArray.includes(x));

  const items = difference.map((id) => {
    const rObj = {
      updateOne: {
        filter: { mintAddress: id },
        update: {
          $set: {
            forSale: false,
          },
        },
      },
    };
    return rObj;
  });
  Item.bulkWrite(items).catch((err) => {
    logger.error(`updateForSale of ${symbol} error: ${err}`);
  });
};

exports.updateListingTime = async (ids, symbol) => {
  console.log(`Updating listedFor of items of collection ${symbol}`);
  const concatData = new Map();
  await Promise.all(ids.map(async (id) => {
    const config = {
      url: String(`https://api-mainnet.magiceden.io/rpc/getGlobalActivitiesByQuery?q={"$match":{"mint":"${id}"},"$sort":{"blockTime":-1,"createdAt":-1},"$skip":0}`),
      httpsAgent: agent,
    };
    return axios.request(config)
      .then((periodResponse) => {
        if (periodResponse.code === 'ECONNRESET' || periodResponse.code === 'ERR_SOCKET_CLOSED') throw new Error('An error occured while reaching magiceden api');
        const { results } = periodResponse.data;
        results.every((it) => {
          let listedFor;
          // const { txType } = it;
          if (it.txType === 'initializeEscrow') {
            const timeDiff = (new Date(Date.now()) - Date.parse(it.createdAt));
            const inMinutes = Number(timeDiff / 60000)
              .toFixed(2);
            listedFor = inMinutes;
            concatData.set(it.mint, listedFor);
            return false;
          }
          return true;
        });
      })
      .catch((error) => {
        logger.error(`updateListingTime1hr error 1: ${error}`);
      });
  })).catch((err) => {
    logger.error(`updateListingTime Promise.all error: ${err}`);
  });
  const items = Array.from(concatData.entries(), ([key, value]) => {
    const rObj = {
      updateOne: {
        filter: { mintAddress: key },
        update: {
          $set: {
            listedFor: value,
          },
        },
        upsert: true,
      },
    };
    return rObj;
  });
  Item.bulkWrite(items).catch((err) => {
    logger.error(`updateListingTime error: ${err}`);
  });
};
