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
  name: String,
  for_sale: Boolean,
  attributes: [{
    trait_type: String,
    value: String,
    rarity: Number,
  }],
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
  collectionSymbol: {
    type: String,
    required: true,
  },
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
