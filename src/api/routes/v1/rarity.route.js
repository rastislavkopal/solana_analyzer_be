const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/rarity.controller');
const { accessCollectionRarity } = require('../../validations/rarity.validation');
const { authorize } = require('../../middlewares/auth');

const router = express.Router();

router.param('raritySymbol', controller.load);
router.param('symbol', controller.load);
router
  .route('/rarity')
  .get(
    authorize(),
    validate(accessCollectionRarity),
    controller.getCollectionRaritySheet,
  )
  .post(authorize(), validate(accessCollectionRarity), controller.addCollectionRarity)
  .delete(
    authorize(),
    validate(accessCollectionRarity),
    controller.removeCollectionRarity,
  );

router
  .route('/rarity/all')
  .get(authorize(), controller.listRaritySheets);

router
  .route('/rarity/:symbol/:percentage')
  .get(authorize(), controller.getRarityItems);

module.exports = router;
