const axios = require('axios');
const { agent } = require('../utils/proxyGenerator');
const Collection = require('../models/collection.model');
const RaritySheet = require('../models/raritySheet.model');
const rarityController = require('../controllers/rarity.controller');

/**
 * Create collection if does not already exists
 * @public
 */
exports.createCollectionIfNotExists = async (collectionSymbol, raritySymbol) => {
  const config = {
    url: String(`https://api-mainnet.magiceden.io/collections/${collectionSymbol}`),
    httpsAgent: agent,
  };
  console.log('Waiting for ME....');
  const collectionRes = await axios.request(config);
  console.log('Waiting over, yaay');
  const {
    symbol, description, image, name, totalItems,
  } = collectionRes.data;

  if (symbol) {
    const res = await Collection.findOne({ symbol });
    if (!res) {
      const newCollection = new Collection({
        symbol,
        market_name: 'https://magiceden.io/',
        raritySymbol,
        name,
        totalItems,
        description,
        image,
        active: true,
      });
      console.log('to be created');
      this.updateCollectionRarity(raritySymbol, null);
      return newCollection.save();
    }
    console.log('Collection already exists');
    return res;
  }
  console.log('Fetched collection response is null.');
  return null;
};

/**
 * Add rarity sheet if it doesn't already exist
 * @public
 */
exports.updateCollectionRarity = async (raritySymbol, collectionId) => {
  const config = {
    url: String(`https://howrare.is/api/v0.1/collections/${raritySymbol}`),
    httpsAgent: agent,
  };

  const collectionRes = await axios.request(config);
  const {
    // eslint-disable-next-line camelcase
    twitter, discord, website, logo, items, ranking_url,
  } = collectionRes.data.result.data;
  const map1 = new Map();
  items.forEach((item) => {
    map1.set(item.mint, item);
  });
  if (collectionRes.data.result.data) {
    if (raritySymbol) {
      const res = await RaritySheet.findOne({ raritySymbol });
      if (!res) {
        const newRaritySheet = await new RaritySheet({
          raritySymbol,
          ranking_url,
          twitter,
          discord,
          website,
          logo,
          collectionId,
          items: map1,
        });
        console.log('Saving new raritySheet');
        return newRaritySheet.save();
      }
      console.log('Collection already exists');
      return res;
    }
    console.log('Collection not yet created');
    return null;
  }
  console.log('Invalid collection name');
  return null;
};

exports.removeCollectionRarityIfNotExists = async (raritySymbol, collectionId) => {
  const res = await RaritySheet.findOne({ $or: [{ raritySymbol }, { collectionId }] });
  if (res) {
    console.log('To be deleted');
    await RaritySheet.deleteMany({ $or: [{ raritySymbol }, { collectionId }] });
    return 'Success';
  }
  console.log('Already deleted');
  return null;
};

exports.loadActive = async (req, res, next) => {
  try {
    const activeCollections = await Collection.find({ active: true });
    const collectionSymbolList = activeCollections.map((collection) => collection.symbol);
    return collectionSymbolList;
  } catch (error) {
    return next(error);
  }
};
