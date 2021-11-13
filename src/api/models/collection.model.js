const mongoose = require('mongoose');

/**
 * Refresh Token Schema
 * @private
 */
const CollectionSchema = new mongoose.Schema({
  collection_name_id: {
    type: String,
    required: true,
    index: true,
  },
  collection_full_name: String,
  description: String,
  total_volume: Number,
  daily_volume: Number,
  weekly_volume: Number,
  total_sales: Number,
  daily_sales: Number,
  weekly_sales: Number,
  category: String,
  floor_price: Number,
  owner_count: Number,
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

CollectionSchema.pre('save', (next) => {
  this.updated_at = Date.now();
  return next();
});

/**
 * @typedef Collection
 */
const Collection = mongoose.model('Collection', CollectionSchema);
module.exports = Collection;
