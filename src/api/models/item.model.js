const mongoose = require('mongoose');
const upsertMany = require('@meanie/mongoose-upsert-many');

/**
 * nft: Item Schema
 * @private
 */
const ItemSchema = new mongoose.Schema({
  item_api_id: {
    type: Number,
    required: true,
    index: true,
  },
  item_name: {
    type: String,
    required: true,
    index: true,
  },
  description: String,
  token_add: String,
  for_sale: Boolean,
  seller_address: String,
  attributes: String,
  skin: String,
  ranking: Number,
  price: {
    type: Number,
    required: true,
    index: true,
  },
  last_sold_price: Number,
  collectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection',
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
}, {
  // Schema-wide configuration for the upsertMany plugin
  upsertMany: {
    matchFields: ['item_api_id'],
    type: 'replaceOne',
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
