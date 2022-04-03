const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/holders.controller');
const { getWhales } = require('../../validations/holders.validation');
const { authorize, LOGGED_USER } = require('../../middlewares/auth');

const router = express.Router();

router.param('symbol', controller.load);

router
  .route('/:symbol/holders')
  .get(authorize(LOGGED_USER), controller.listHolders);

router
  .route('/:symbol/holders/count')
  .get(authorize(LOGGED_USER), controller.getHoldersCount);

router
  .route('/:symbol/holders/whales')
  .get(authorize(LOGGED_USER), validate(getWhales), controller.getWhalesList);

module.exports = router;
