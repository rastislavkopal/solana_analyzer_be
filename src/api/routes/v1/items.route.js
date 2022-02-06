const express = require('express');
const controller = require('../../controllers/items.controller');

const router = express.Router();

/**
 * Load collection when API with collectionNameId route parameter is hit
 */
router.param('symbol', controller.load);

// router
//   .route('')
//   .get(controller.listItems);

router
  .route('/:symbol/item/listings')
  .get(controller.getListingPriceDistribution);

module.exports = router;
