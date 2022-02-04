const mongoose = require('mongoose');

/**
 * Refresh Token Schema
 * @private
 */
const collectionTsSchema = new mongoose.Schema(
  {
    name: String,
    timestamp: Date,
    metadata: {
      symbol: String,
      floorPrice: Number,
      listedCount: Number,
      listedTotalValue: Number,
      avgPrice24hr: Number,
      volume24hr: Number,
      volumeAll: Number,
    },
  },
  {
    timeseries: {
      timeField: 'timestamp',
      metaField: 'metadata',
      granularity: 'minutes',
    },
    expireAfterSeconds: 2678400,
  },
);

/**
 * @typedef Collection
 */
module.exports = mongoose.model('CollectionTs', collectionTsSchema);
