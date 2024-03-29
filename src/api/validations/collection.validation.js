const Joi = require('joi');

module.exports = {

  // GET /v1/collection/:symbol/history
  getHistoricalData: {
    params: {
      symbol: Joi.string().max(128).required(),
    },
    query: {
      limit: Joi.number().min(1).max(200),
      dense: Joi.number().min(1).max(1440),
    },
  },
  // POST /v1/collection/:symbol/history
  addCollection: {
    body: {
      symbol: Joi.string().max(128).required(),
      raritySymbol: Joi.string().max(128),
    },
  },
};
