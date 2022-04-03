const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/items.controller');
const { listItemsBellowRank } = require('../../validations/items.validation');
const { authorize, LOGGED_USER } = require('../../middlewares/auth');

const router = express.Router();

/**
 * Load collection when API with collectionNameId route parameter is hit
 */
router.param('symbol', controller.load);

router
  .route('/:symbol/item/all')
  .get(authorize(), controller.listItems);

router
  .route('/:symbol/item/')
  .get(authorize(), controller.test);

module.exports = router;
