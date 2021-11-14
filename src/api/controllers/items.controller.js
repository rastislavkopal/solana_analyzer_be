// const httpStatus = require('http-status');
const axios = require('axios');
const Collection = require('../models/collection.model');
const Item = require('../models/item.model');

/**
 * Load collection and append to req.
 * @public
 */
exports.load = async (req, res, next, collectionNameId) => {
  try {
    const collection = await Collection.find({ collection_name_id: collectionNameId });
    req.locals = { collection };
    return next();
  } catch (error) {
    return next(error);
  }
};

/**
 * Get Solanart collections list
 * @public
 */
exports.listItems = async (req, res, next) => {
  try {
    const colectionName = req.locals.collection[0].collection_name_id;
    const collectionUrl = `https://qzlsklfacc.medianetwork.cloud/nft_for_sale?collection=${colectionName}`;
    // get selected collection and update all its listed items

    // console.log(colectionName);
    // const collection = Collection.find({ collection_name_id: colectionName });
    // console.log(collection);
    axios
      .get(collectionUrl)
      .then((response) => {
        const items = response.data.map((item) => {
          const rObj = {
            item_api_id: item.id,
            item_name: item.name,
            token_add: item.token_add,
            seller_address: item.seller_address,
            price: item.price,
            for_sale: item.for_sale,
            attributes: item.attributes,
            skin: item.skin,
            ranking: item.ranking,
            last_sold_price: item.lastSoldPrice,
            // collectionId: collection,
          };
          return rObj;
        });
        Item.upsertMany(items).then(() => {}).catch((err) => { console.log(err); });
        res.setHeader('Content-Type', 'application/json');
        res.json(items);
      });
  } catch (error) {
    next(error);
  }
};
