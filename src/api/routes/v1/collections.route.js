const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/collections.controller');
const { getHistoricalData, addCollection } = require('../../validations/collection.validation');
const { authorize, LOGGED_USER } = require('../../middlewares/auth');

const router = express.Router();

router
  .route('/')
  .get(authorize(LOGGED_USER), controller.listCollections)
  .post(authorize(LOGGED_USER), validate(addCollection), controller.addCollection)
  .delete(authorize(LOGGED_USER), controller.removeCollections);

router
  .route('/mainPage/')
  .get(authorize(LOGGED_USER), controller.collectionStats);

router.param('symbol', controller.load);

router
  .route('/:symbol')
  .get(authorize(LOGGED_USER), controller.getCollection)
  .put(authorize(LOGGED_USER), controller.updateCollection);

router
  .route('/:symbol/history/complete')
  .get(
    authorize(LOGGED_USER),
    validate(getHistoricalData),
    controller.getCollectionHistoryComplete
  );

router
  .route('/:symbol/history/floor')
  .get(authorize(LOGGED_USER), validate(getHistoricalData), controller.getCollectionHistoryFloor);

router
  .route('/:symbol/history/listings')
  .get(
    authorize(LOGGED_USER),
    validate(getHistoricalData),
    controller.getCollectionHistoryListings
  );

module.exports = router;
