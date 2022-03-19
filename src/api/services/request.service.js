const axios = require('axios');
const axiosRetry = require('axios-retry');
const logger = require('../../config/logger');

exports.request = async (config) => {
  axiosRetry(axios, {
    retries: 3, // number of retries
    retryDelay: (retryCount) => {
      logger.error(`retry attempt: ${retryCount}`);
      return retryCount * 2000; // time interval between retries
    },
    retryCondition: (error) => {
      // console.log('request.service LOG: '+JSON.stringify(error));
      return error.name === 'Error';
    },
  });
  return axios.request(config);
};
