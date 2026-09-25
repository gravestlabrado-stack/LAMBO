const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Placeholder handlers (implemented in Phase 1)
router.post('/register', (req, res) => {
  res.status(501).json({ success: false, message: 'Auth register route scaffolded' });
});

router.post('/login', (req, res) => {
  res.status(501).json({ success: false, message: 'Auth login route scaffolded' });
});

router.get('/me', protect, (req, res) => {
  res.json({ success: true, user: req.user });
});

module.exports = router;
