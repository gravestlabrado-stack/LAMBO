const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Placeholder handlers (implemented in Phase 11)
router.get('/', protect, (req, res) => {
  res.json({ success: true, count: 0, data: [] });
});

router.post('/subscribe', protect, (req, res) => {
  res.status(501).json({ success: false, message: 'Subscribe to push route scaffolded' });
});

module.exports = router;
