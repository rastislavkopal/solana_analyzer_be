const Joi = require('joi');

module.exports = {

  accessCollectionRarity: {
    body: {
      collectionId: Joi.string().max(128).allow(''),
      raritySymbol: Joi.string().max(128).required(),
    },
  },
};
