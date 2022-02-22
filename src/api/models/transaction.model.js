const mongoose = require('mongoose');

/**
 * Holder schema
 * @private
 */
const transactionSchema = new mongoose.Schema({
  signature: {
    type: String,
    unique: true,
    required: true,
    index: true,
  },
  mintAddress: {
    type: String,
    required: true,
    index: true,
  },
  buyer: {
    type: String,
    required: true,
  },
  seller: {
    type: String,
    required: true,
  },
  collectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection',
    required: true,
  },
  price: Number,
  isWhale: Boolean,
  transactionType: String,
  createdAt: {
    type: Date,
    default: Date.now,
    index: { expires: '24h' },
  },
});

/**
 * @typedef Transaction
 */
module.exports = mongoose.model('Transaction', transactionSchema);
