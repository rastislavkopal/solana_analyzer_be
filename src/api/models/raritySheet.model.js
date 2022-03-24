const mongoose = require('mongoose');
/**
 * Refresh Token Schema
 * @private
 */
const raritySheetSchema = new mongoose.Schema({
  raritySymbol: {
    type: String,
    index: true,
    required: true,
  },
  collectionSymbol: String,
  ranking_url: String,
  twitter: String,
  discord: String,
  website: String,
  logo: String,
});

/*
* Run pre-save fn
*/

raritySheetSchema.pre('save', (next) => {
  this.updated_at = Date.now();
  return next();
});
// collectionSchema.index({ symbol: 1, type: -1 }); // schema level
/**
 * Methods
 */
raritySheetSchema.method({
  transform() {
    const transformed = {};
    console.log('transform');
    const fields = ['raritySymbol', 'ranking_url', 'twitter', 'discord', 'website', 'logo', 'collectionSymbol'];

    fields.forEach((field) => {
      transformed[field] = this[field];
    });
    return transformed;
  },
});
module.exports = mongoose.model('RaritySheet', raritySheetSchema);
