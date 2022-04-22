const mongoose = require('mongoose');

/**
 * User Schema
 * @private
 */
const solysisTokenSchema = new mongoose.Schema({
  mint: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
});

/**
 * @typedef SolysisToken
 */
module.exports = mongoose.model('SolysisToken', solysisTokenSchema);
