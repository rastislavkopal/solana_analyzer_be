const mongoose = require('mongoose');

/**
 * Refresh Token Schema
 * @private
 */
const collectionSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    index: true,
  },
  market_name: String,
  name: String,
  description: String,
  image: String,
  creators: String,
  totalItems: Number,
  category: String,
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
    const fields = ['symbol', 'market_name', 'name', 'description', 'category'];

    fields.forEach((field) => {
      transformed[field] = this[field];
    });

    return transformed;
  },
});

// collectionSchema.index({ symbol: 1, type: -1 }); // schema level

/**
 * @typedef Collection
 */
module.exports = mongoose.model('Collection', collectionSchema);
