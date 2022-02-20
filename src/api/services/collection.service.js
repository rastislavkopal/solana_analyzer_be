const axios = require('axios');
const { agent } = require('../utils/proxyGenerator');
const Collection = require('../models/collection.model');
const RaritySheet = require('../models/raritySheet.model');

/**
 * Create collection if does not already exists
 * @public
 */
exports.createCollectionIfNotExists = async (collectionSymbol, raritySymbol) => {
  const config = {
    url: String(`https://api-mainnet.magiceden.io/collections/${collectionSymbol}`),
    httpsAgent: agent,
  };

  const collectionRes = await axios.request(config);

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
      });
      console.log('to be created');
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
exports.updateCollectionRarity = async (collectionId, raritySymbol) => {
  const config = {
    url: String(`https://howrare.is/api/v0.1/collections/${raritySymbol}`),
    httpsAgent: agent,
  };

  const collectionRes = await axios.request(config);
  const {
    twitter, discord, website, logo, items,
  } = collectionRes.data.result.data;

  const map1 = new Map();
  items.forEach((item) => {
    map1.set(item.mint, item);
  });
  if (collectionRes.data.result.data) {
    if (collectionId) {
      const res = await RaritySheet.findOne({ collectionId });
      if (!res) {
        const newRaritySheet = await new RaritySheet({
          raritySymbol,
          ranking_url: 'https://howrare.is/888anonclub',
          twitter,
          discord,
          website,
          logo,
          collectionId,
          items: map1,
        });
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

exports.removeCollectionRarityIfNotExists = async (collectionId) => {
  const res = await RaritySheet.findOne({ collectionId });
  if (res) {
    console.log('To be deleted');
    await RaritySheet.deleteMany({ collectionId });
    return 'Success';
  }
  console.log('Already deleted');
  return null;
};
