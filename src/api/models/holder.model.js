const mongoose = require('mongoose');

/**
 * Holder schema
 * @private
 */
const holderSchema = new mongoose.Schema({
  walletId: {
    type: String,
    required: true,
    index: true,
    maxLength: 64,
  },
  collectionId: String,
  collections: [{
    symbol: {
      type: String,
      index: true,
      required: true,
    },
    itemsCount: Number,
    isWhale: {
      type: Boolean,
      default() {
        return this.itemsCount > 6;
      },
    },
  }],

});

/**
 * @typedef Holder
 */
module.exports = mongoose.model('Holder', holderSchema);
