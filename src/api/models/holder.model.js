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
  collectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection',
    index: true,
    required: true,
  },
  itemsCount: Number,
});

/**
 * @typedef Holder
 */
module.exports = mongoose.model('Holder', holderSchema);
