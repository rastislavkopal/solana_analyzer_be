const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/collections.controller');
const { getHistoricalData, addCollection } = require('../../validations/collection.validation');

const router = express.Router();

router
  .route('/')
  .get(controller.listCollection)
  .post(listCollections, controller.addCollection);

router
  .route('/all')
  .get(controller.listAllCollections);

router
  .route('/rarity/')
  .get(controller.getCollectionRaritySheet)
  .post(controller.addCollectionRarity);

router
  .route('/rarity/')
  .delete(controller.removeCollectionRarity);

router
  .route('/rarity/all')
  .get(controller.listRaritySheets);

router.param('symbol', controller.load);

router
  .route('/:symbol/history/complete')
  .get(validate(getHistoricalData), controller.getCollectionHistoryComplete);

router
  .route('/:symbol/history/floor')
  .get(validate(getHistoricalData), controller.getCollectionHistoryFloor);

router
  .route('/:symbol/history/listings')
  .get(validate(getHistoricalData), controller.getCollectionHistoryListings);

module.exports = router;
