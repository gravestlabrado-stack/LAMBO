const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getGrowthLogs,
  getGrowthLogById,
  createGrowthLog,
  updateGrowthLog,
  deleteGrowthLog,
  exportTreeLogs,
} = require('../controllers/growthLogController');

router.get('/', protect, getGrowthLogs);
router.post('/', protect, upload.single('photo'), createGrowthLog);
router.get('/export/:treeId', protect, exportTreeLogs);
router.get('/:id', protect, getGrowthLogById);
router.put('/:id', protect, upload.single('photo'), updateGrowthLog);
router.delete('/:id', protect, deleteGrowthLog);

module.exports = router;
