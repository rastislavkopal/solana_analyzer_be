const mongoose = require('mongoose');

/**
 * Refresh Token Schema
 * @private
 */
const ItemSchema = new mongoose.Schema({
  item_id: {
    type: String,
    requitred: true,
    index: true,
  },
  item_name: {
    type: String,
    required: true,
    index: true,
  },
  item_full_name: String,
  description: String,
  token_add: String,
  for_sale: Boolean,
  seller_address: String,
  current_price: Number,
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
});

ItemSchema.pre('save', (next) => {
  this.updated_at = Date.now();
  return next();
});

/**
 * @typedef Collection
 */
const Item = mongoose.model('Item', ItemSchema);
module.exports = Item;
