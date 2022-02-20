// const updateCollectionsTask = require('./tasks/updateCollectionsTask');
// const updateItemTask = require('./tasks/updateItemsTask');
// const tokenInfoCrawlerTask = require('./tasks/tokenInfoCrawlerTask');
const collectionTimestampTask = require('./tasks/collectionTimestampTask');
const listedPriceDistributionTask = require('./tasks/listedPriceDistributionTask');
const updateHoldersTask = require('./tasks/updateHolders.task');

const tasks = {
  // updateCollectionsTask,
  // updateItemTask,
  // tokenInfoCrawlerTask,
  listedPriceDistributionTask,
  collectionTimestampTask,
  updateHoldersTask,
};

module.exports = tasks;
