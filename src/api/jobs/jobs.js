const collectionTimestampTask = require('./tasks/collectionTimestampTask');
const updateItemsTask1hr = require('./tasks/updateItemsTask1hr');
const updateItemsTask1m = require('./tasks/updateItemsTask1m');
const updateHoldersTask = require('./tasks/updateHolders.task');
const getBuyTransactionsTask = require('./tasks/getBuyTransactionsTask');
const findOverBidsTask = require('./tasks/findOverBidsTask');

const tasks = {
  collectionTimestampTask, // dedicated VM is running this job :)
  updateItemsTask1hr,
  updateItemsTask1m,
  getBuyTransactionsTask,
  updateHoldersTask,
  findOverBidsTask,
};

module.exports = tasks;
