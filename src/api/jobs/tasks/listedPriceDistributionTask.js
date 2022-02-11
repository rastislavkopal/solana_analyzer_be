const cron = require('node-cron');
const axios = require('axios');
const Collection = require('../../models/collection.model');
const CollectionTs = require('../../models/collectionTs.model');
const logger = require('../../../config/logger');
const { agent } = require('../../utils/proxyGenerator');

const updatePriceDistribution = cron.schedule('*/5 * * * *', async () => {
});

module.exports = updatePriceDistribution;
