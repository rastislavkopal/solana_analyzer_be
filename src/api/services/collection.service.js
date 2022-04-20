const axios = require('axios');
const { agent } = require('../utils/proxyGenerator');
const Collection = require('../models/collection.model');
const RaritySheet = require('../models/raritySheet.model');
const logger = require('../../config/logger');
const ItemService = require('./item.service');
// const rarityController = require('../controllers/rarity.controller');

/**
 * Create collection if does not already exists
 * @public
 */
exports.createCollectionIfNotExists = async (collectionSymbol, raritySymbol) => {
  const config = {
    url: String(`https://api-mainnet.magiceden.dev/collections/${collectionSymbol}`),
    httpsAgent: agent,
  };

  const ret = await axios.request(config)
    .then(async (res) => {
      const {
        symbol, description, image, name, totalItems,
      } = res.data;

      if (symbol) {
        const collection = await Collection.findOne({ symbol });
        if (!collection) {
          const newCollection = new Collection({
            symbol,
            market_name: 'https://magiceden.io/',
            name,
            totalItems,
            description,
            image,
            active: true,
          });
          if (raritySymbol) newCollection.raritySymbol = raritySymbol;

          await newCollection.save();
          this.updateCollectionRarity(raritySymbol, symbol);
          return newCollection;
        }
        return collection;
      }
      return null;
    })
    .catch((err) => {
      logger.error(`An error occured while adding new collection ${collectionSymbol}, ${err}`);
    });
  return ret;
};

/**
 * Add rarity sheet if it doesn't already exist
 * @public
 */
exports.updateCollectionRarity = async (raritySymbol, collectionSymbol) => {
  if (!raritySymbol) {
    return;
  }

  const config = {
    url: String(`https://howrare.is/api/v0.1/collections/${raritySymbol}`),
    httpsAgent: agent,
  };

  await axios.request(config)
    .then(async (response) => {
      const {
        // eslint-disable-next-line camelcase
        twitter, discord, website, logo, items, ranking_url,
      } = response.data.result.data;

      const map1 = new Map();
      items.forEach((item) => {
        const itemAttr = item.attributes;
        const itemRank = item.rank;
        const itemName = item.name;
        map1.set(item.mint, {
          itemAttr,
          itemRank,
          itemName,
        });
      });
      ItemService.updateItemsFromRarityMap(map1);

      if (response.data.result.data && raritySymbol) {
        const res = await RaritySheet.findOne({ raritySymbol });
        console.log(`!res: ${JSON.stringify(res)}`);
        if (!res) {
          new RaritySheet({
            raritySymbol,
            ranking_url,
            twitter,
            discord,
            website,
            logo,
            collectionSymbol,
          }).save();
          return 'Success!';
        }
      }
      return 'Success!';
    }).catch((err) => {
      logger.error(`Update collection rarity error: ${err}`);
    });
};

exports.removeCollectionRarityIfNotExists = async (raritySymbol, collectionSymbol) => {
  const res = await RaritySheet.findOne({ $or: [{ raritySymbol }, { collectionSymbol }] });
  if (res) {
    console.log('To be deleted');
    await RaritySheet.deleteMany({ $or: [{ raritySymbol }, { collectionSymbol }] });
    return 'Success';
  }
  console.log('Already deleted');
  return null;
};

exports.loadActive = async () => {
  try {
    const activeCollections = await Collection.find({ active: true });
    const collectionSymbolList = activeCollections.map((collection) => collection.symbol);
    return collectionSymbolList;
  } catch (error) {
    logger.error(`collection.service loadActive() error: ${error}`);
    return null;
  }
};
