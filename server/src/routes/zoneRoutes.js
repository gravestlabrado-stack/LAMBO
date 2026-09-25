const express = require('express');
const router = express.Router();
const { getZones, createZone } = require('../controllers/zoneController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getZones);
router.post('/', protect, createZone);

module.exports = router;
