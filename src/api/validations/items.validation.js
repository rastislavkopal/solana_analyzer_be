const Joi = require('joi');

module.exports = {

  // GET /v1/collection/:symbol/history
  listItemsBellowRank: {
    params: {
      symbol: Joi.string().max(128).required(),
      rank: Joi.number().max(5).required(),
    },
  },
  listItems: {
    params: {
      symbol: Joi.string().max(128).required(),
    },
  },
};
