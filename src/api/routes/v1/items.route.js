const express = require('express');
const controller = require('../../controllers/items.controller');

const router = express.Router();

/**
 * Load collection when API with collectionNameId route parameter is hit
 */
router.param('collectionNameId', controller.load);

router
  .route('/:collectionNameId/item')
  .get(controller.listItems);

module.exports = router;
