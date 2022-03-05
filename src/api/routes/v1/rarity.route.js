const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/rarity.controller');
const { accessCollectionRarity } = require('../../validations/rarity.validation');

const router = express.Router();

router.param('raritySymbol', controller.load);

router
  .route('/rarity')
  .get(validate(accessCollectionRarity), controller.getCollectionRaritySheet)
  .post(validate(accessCollectionRarity), controller.addCollectionRarity)
  .delete(validate(accessCollectionRarity), controller.removeCollectionRarity);

router
  .route('/rarity/all')
  .get(controller.listRaritySheets);

module.exports = router;
