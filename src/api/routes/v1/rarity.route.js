const express = require('express');
const controller = require('../../controllers/rarity.controller');

const router = express.Router();

router.param('symbol', controller.load);

router
  .route('/:symbol/rarity')
  .get(controller.getCollectionRaritySheet)
  .post(controller.addCollectionRarity)
  .delete(controller.removeCollectionRarity);

router
  .route('/:symbol/rarity/all')
  .get(controller.listRaritySheets);

module.exports = router;
