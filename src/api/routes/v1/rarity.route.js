const express = require('express');
const validate = require('express-validation');
const controller = require('../../controllers/rarity.controller');
const { accessCollectionRarity } = require('../../validations/rarity.validation');
const { authorize, LOGGED_USER } = require('../../middlewares/auth');

const router = express.Router();

router.param('raritySymbol', controller.load);

router
  .route('/rarity')
  .get(
    authorize(LOGGED_USER),
    validate(accessCollectionRarity),
    controller.getCollectionRaritySheet
  )
  .post(authorize(LOGGED_USER), validate(accessCollectionRarity), controller.addCollectionRarity)
  .delete(
    authorize(LOGGED_USER),
    validate(accessCollectionRarity),
    controller.removeCollectionRarity
  );

router
  .route('/rarity/all')
  .get(authorize(LOGGED_USER), controller.listRaritySheets);

module.exports = router;
