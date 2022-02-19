const mongoose = require('mongoose');

/**
 * Refresh Token Schema
 * @private
 */
const raritySheetSchema = new mongoose.Schema({
  collectionName: String,
  ranking_url: String,
  twitter: String,
  discord: String,
  website: String,
  logo: String,
  collectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Collection',
    required: true,
  },
  items: {
    type: Map,
    of: {
      id: Number,
      link: String,
      mint: String,
      name: String,
      rank: Number,
      rankAlgo: String,
      attributes: [{
        name: String,
        value: String,
        rarity: Number,
      }],
    },
  },
  /*
  items: [{
    id: Number,
    link: String,
    mint: String,
    name: String,
    rank: Number,
    rankAlgo: String,
  }],
   */
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
    const fields = ['collectionName', 'ranking_url', 'twitter', 'discord', 'website', 'logo', 'collectionId'];

    fields.forEach((field) => {
      transformed[field] = this[field];
    });
    return transformed;
  },
});
module.exports = mongoose.model('RaritySheet', raritySheetSchema);
