const express = require('express');
// const validate = require('express-validation');
const controller = require('../../controllers/collections.controller');

const router = express.Router();

router
  .route('/solanart')
  .get(controller.listSolanart);

module.exports = router;
