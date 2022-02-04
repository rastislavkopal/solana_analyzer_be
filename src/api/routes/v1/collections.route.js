const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/collections.controller');
const { getHistoricalData } = require('../../validations/collection.validation');

const router = express.Router();

router
  .route('/')
  .get(controller.listCollections)
  .post(controller.addCollection);

router.param('symbol', controller.load);

router
  .route('/:symbol/history')
  .get(validate(getHistoricalData), controller.getCollectionHistory);

module.exports = router;
