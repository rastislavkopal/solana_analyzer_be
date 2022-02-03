const express = require('express');
const userRoutes = require('./user.route');
const authRoutes = require('./auth.route');
const collectionsRoutes = require('./collections.route');
// const itemsRoutes = require('./items.route');

const router = express.Router();

/**
 * GET v1/status
 */
router.get('/status', (req, res) => res.send('OK'));

/**
 * GET v1/docs
 */
router.use('/docs', express.static('docs'));

router.use('/users', userRoutes);
router.use('/auth', authRoutes);

/*
* Collections and items
*/
router.use('/collection', collectionsRoutes);
// router.use('/collection', itemsRoutes);

module.exports = router;
