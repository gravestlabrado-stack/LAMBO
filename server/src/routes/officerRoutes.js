const express = require('express');
const router = express.Router();
const { protect, requireOfficer } = require('../middleware/auth');
const {
  getCadetRoster,
  getCadetDetails,
  getOfficerSummaryStats,
} = require('../controllers/officerController');

// All officer routes require authentication + officer clearance
router.use(protect);
router.use(requireOfficer);

router.get('/roster', getCadetRoster);
router.get('/cadet/:id', getCadetDetails);
router.get('/stats', getOfficerSummaryStats);

module.exports = router;
