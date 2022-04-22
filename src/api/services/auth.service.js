const moment = require('moment-timezone');
const jwt = require('jwt-simple');
const { jwtSecret, jwtExpirationInterval } = require('../../config/vars');
const logger = require('../../config/logger');
const SolysisToken = require('../models/solysisToken.model');

exports.generateNftAccessToken = async (mints, userId) => {
  const solysiTokens = await SolysisToken.find({}).exec();
  const tokenSet = new Set();

  solysiTokens.forEach((token) => {
    tokenSet.add(token.mint);
  });

  const receivedTokenSet = new Set(mints);

  const intersect = new Set([...tokenSet].filter((i) => receivedTokenSet.has(i)));

  if (intersect.size !== 0) {
    const payload = {
      exp: moment().add(jwtExpirationInterval, 'minutes').unix(),
      iat: moment().unix(),
      sub: userId,
      mint: intersect.values().next().value,
    };
    return jwt.encode(payload, jwtSecret);
  }

  return null;
};
