const mongoose = require('mongoose');

/**
 * Refresh Token Schema
 * @private
 */
const collectionSchema = new mongoose.Schema({
  collection_name_id: {
    type: String,
    required: true,
    index: true,
  },
  market_name: String,
  collection_full_name: String,
  description: String,
  creators: String,
  total_volume: Number,
  daily_volume: Number,
  weekly_volume: Number,
  total_sales: Number,
  daily_sales: Number,
  weekly_sales: Number,
  prev_daily_sales: Number,
  prev_daily_volume: Number,
  prev_weekly_sales: Number,
  prev_weekly_volume: Number,
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
  api_last_updated: Number,
});

/*
* Run pre-save fn
*/
collectionSchema.pre('save', (next) => {
  this.updated_at = Date.now();
  return next();
});

/**
 * Methods
 */
collectionSchema.method({
  transform() {
    const transformed = {};
    const fields = ['collection_name_id', 'market_name', 'collection_full_name', 'description', 'total_volume', 'daily_volume', 'weekly_volume', 'total_sales', 'daily_sales', 'weekly_sales', 'category', 'floor_price'];

    fields.forEach((field) => {
      transformed[field] = this[field];
    });

    return transformed;
  },
});

// collectionSchema.index({ collection_name_id: 1, type: -1 }); // schema level

/**
 * @typedef Collection
 */
module.exports = mongoose.model('Collection', collectionSchema);
