const mongoose = require('mongoose');
const httpStatus = require('http-status');
const { omitBy, isNil } = require('lodash');
const bcrypt = require('bcryptjs');
const moment = require('moment-timezone');
const jwt = require('jwt-simple');
const uuidv4 = require('uuid/v4');
const APIError = require('../errors/api-error');
const { env, jwtSecret, jwtExpirationInterval } = require('../../config/vars');
const logger = require('../../config/logger');
const SolysisToken = require('../models/solysisToken.model');

exports.generateNftAccessToken = async (mints) => {
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
      sub: intersect.values().next().value,
    };
    return jwt.encode(payload, jwtSecret);
  }

  return null;
};
