const axios = require('axios');
const axiosRetry = require('axios-retry');
const logger = require('../../config/logger');

exports.request = async (config) => {
  axiosRetry(axios, {
    retries: 5, // number of retries
    retryCondition: (error) => error.name === 'Error',
  });
  return axios.request(config);
};
