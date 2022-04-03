const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/transaction.controller');
const { authorize } = require('../../middlewares/auth');

const router = express.Router();

router.param('symbol', controller.load);

router
  .route('/:symbol/toptransactions/:number')
  .get(authorize(), controller.getLastBigSales);

router
  .route('/:symbol/buytransactions/:number')
  .get(controller.getLastSales);

module.exports = router;
