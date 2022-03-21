// make bluebird default Promise
Promise = require('bluebird'); // eslint-disable-line no-global-assign
const { port, env } = require('./config/vars');
const logger = require('./config/logger');
const app = require('./config/express');
const mongoose = require('./config/mongoose');

// open mongoose connection
mongoose.connect();

// start the background jobs automatically
require('./api/jobs/jobs');

// const v8 = require('v8'); // get the max heap size info in GBs
// logger.info((v8.getHeapStatistics().total_available_size / 1024 /1024 / 1024).toFixed(2));

// listen to requests
app.listen(port, () => logger.info(`server started on port ${port} (${env})`));

/**
* Exports express
* @public
*/
module.exports = app;
