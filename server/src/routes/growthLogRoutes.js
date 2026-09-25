const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Placeholder handlers (implemented in Phase 2)
router.get('/', protect, (req, res) => {
  res.json({ success: true, count: 0, data: [] });
});

router.post('/', protect, (req, res) => {
  res.status(501).json({ success: false, message: 'Create growth log route scaffolded' });
});

module.exports = router;
