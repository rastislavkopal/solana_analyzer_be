const Joi = require('joi');

module.exports = {

  accessCollectionRarity: {
    body: {
      collectionSymbol: Joi.string().max(128).allow(''),
      raritySymbol: Joi.string().max(128).required(),
    },
  },
};
