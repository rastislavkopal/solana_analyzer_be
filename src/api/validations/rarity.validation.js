const Joi = require('joi');

module.exports = {

  accessCollectionRarity: {
    params: {
      raritySymbol: Joi.string().max(128).required(),
    },
  },
};
