// const updateCollectionsTask = require('./tasks/updateCollectionsTask');
// const updateItemTask = require('./tasks/updateItemsTask');
// const tokenInfoCrawlerTask = require('./tasks/tokenInfoCrawlerTask');

const collectionTimestampTask = require('./tasks/collectionTimestampTask');
const updateItemsTask = require('./tasks/updateItemsTask');
const updateHoldersTask = require('./tasks/updateHolders.task');
const getBuyTransactionsTask = require('./tasks/getBuyTransactionsTask');

const tasks = {
  collectionTimestampTask, // dedicated VM is running this job :)
  updateItemsTask,
  getBuyTransactionsTask,
  updateHoldersTask,
};

module.exports = tasks;
