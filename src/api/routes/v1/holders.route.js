const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/holders.controller');
const { getWhales } = require('../../validations/holders.validation');

const router = express.Router();

router.param('symbol', controller.load);

router
  .route('/:symbol/holders')
  .get(controller.listHolders);

router
  .route('/:symbol/holders/count')
  .get(controller.getHoldersCount);

router
  .route('/:symbol/holders/whales')
  .get(validate(getWhales), controller.getWhalesList);

module.exports = router;
