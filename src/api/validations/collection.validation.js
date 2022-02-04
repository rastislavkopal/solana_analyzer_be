const Joi = require('joi');

module.exports = {

  // GET /v1/collection/:symbol/history
  getHistoricalData: {
    params: {
      symbol: Joi.string().max(128).required(),
    },
    query: {
      limit: Joi.number().min(1).max(500),
    },
  },
};
