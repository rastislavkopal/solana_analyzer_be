// const httpStatus = require('http-status');
const axios = require('axios');

/**
 * Get collections list
 * @public
 */
exports.list = async (req, res, next) => {
  try {
    axios
      .get('https://qzlsklfacc.medianetwork.cloud/get_collections')
      .then((response) => {
        res.setHeader('Content-Type', 'application/json');
        res.json(response.data[0]);
      })
      .catch((error) => {
        console.log(error.message);
      });
  } catch (error) {
    next(error);
  }
};
