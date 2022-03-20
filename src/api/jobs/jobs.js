// const updateCollectionsTask = require('./tasks/updateCollectionsTask');
// const updateItemTask = require('./tasks/updateItemsTask');
// const tokenInfoCrawlerTask = require('./tasks/tokenInfoCrawlerTask');
const collectionTimestampTask = require('./tasks/collectionTimestampTask');
const updateItemsTask = require('./tasks/updateItemsTask');
const updateHoldersTask = require('./tasks/updateHolders.task');
const getBuyTransactionsTask = require('./tasks/getBuyTransactionsTask');

const tasks = {
  collectionTimestampTask,
  updateItemsTask,
  getBuyTransactionsTask,
  updateHoldersTask,
};

module.exports = tasks;
