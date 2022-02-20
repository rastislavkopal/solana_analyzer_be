const Joi = require('joi');

module.exports = {
  getWhales: {
    params: {
      symbol: Joi.string().max(128).required(),
    },
    query: {
      limit: Joi.number().min(1).max(500),
      treshold: Joi.number().min(1).max(10000),
    },
  },
};
