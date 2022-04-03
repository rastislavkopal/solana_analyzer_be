const mongoose = require('mongoose');
const upsertMany = require('@meanie/mongoose-upsert-many');

/**
 * nft: Item Schema
 * @private
 */
const ItemSchema = new mongoose.Schema({
  mintAddress: {
    type: String,
    required: true,
    index: true,
  },
  img: String,
  collectionSymbol: {
    type: String,
    index: true,
    required: true,
  },
  raritySymbol: String,
  name: String,
  forSale: {
    type: Boolean,
    default: true,
  },
  attributes: [{
    name: String,
    value: String,
    rarity: Number,
  }],
  // In minutes
  listedFor: Number,
  rank: {
    type: Number,
    required: true,
    index: true,
  },
  price: {
    type: Number,
    required: true,
  },
  last_sold_price: Number,
  collectionId: String,
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
  isRare: Boolean,
}, {
  // Schema-wide configuration for the upsertMany plugin
  upsertMany: {
    matchFields: ['mintAddress'],
    type: 'updateOne',
    ensureModel: true,
  },
});

ItemSchema.plugin(upsertMany);

ItemSchema.pre('save', (next) => {
  this.updated_at = Date.now();
  return next();
});

/**
 * @typedef Item
 */
const Item = mongoose.model('Item', ItemSchema);
module.exports = Item;
