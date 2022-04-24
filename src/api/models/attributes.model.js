const mongoose = require('mongoose');
/**
 * Refresh Token Schema
 * @private
 */
const attributesSchema = new mongoose.Schema({
  raritySymbol: {
    type: String,
    index: true,
    required: true,
  },
  collectionSymbol: {
    type: String,
    index: true,
  },
  attributes: [{
    name: String,
    value: String,
    rarity: Number,
  }],
});

/*
* Run pre-save fn
*/

attributesSchema.pre('save', (next) => {
  this.updated_at = Date.now();
  return next();
});
// collectionSchema.index({ symbol: 1, type: -1 }); // schema level
/**
 * Methods
 */
attributesSchema.method({

});
module.exports = mongoose.model('attributes', attributesSchema);
