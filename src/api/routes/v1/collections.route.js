const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/collections.controller');
const { getHistoricalData, addCollection } = require('../../validations/collection.validation');
const { authorize, LOGGED_USER } = require('../../middlewares/auth');

const router = express.Router();

router
  .route('/')
  .get(authorize(), controller.listCollections)
  .post(authorize(), validate(addCollection), controller.addCollection)
  .delete(authorize(), controller.removeCollections);

router
  .route('/mainPage/')
  .get(authorize(), controller.collectionStats);

router.param('symbol', controller.load);

router
  .route('/:symbol')
  .get(authorize(), controller.getCollection)
  .put(authorize(), controller.updateCollection);

router
  .route('/:symbol/history/complete')
  .get(
    authorize(),
    validate(getHistoricalData),
    controller.getCollectionHistoryComplete,
  );

router
  .route('/:symbol/history/floor')
  .get(authorize(), validate(getHistoricalData), controller.getCollectionHistoryFloor);

router
  .route('/:symbol/history/listings')
  .get(
    authorize(),
    validate(getHistoricalData),
    controller.getCollectionHistoryListings,
  );

module.exports = router;
