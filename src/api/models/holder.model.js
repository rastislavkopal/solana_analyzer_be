const mongoose = require('mongoose');

/**
 * Holder schema
 * @private
 */
const holderSchema = new mongoose.Schema({
  walletId: {
    type: String,
    index: true,
    maxLength: 64,
  },
  collectionId: String,

  itemsCount: {
    type: Number,
    default: 0,
  },
  symbol: {
    type: String,
    index: true,
    required: true,
  },
  isWhale: {
    type: Boolean,
    default() {
      return this.itemsCount > 6;
    },
  },
});

/**
 * @typedef Holder
 */
module.exports = mongoose.model('Holder', holderSchema);
