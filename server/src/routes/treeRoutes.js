const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  getTrees,
  getTreeStats,
  getTreeById,
  createTree,
  updateTree,
  deleteTree,
} = require('../controllers/treeController');
const {
  getGrowthLogs,
  createGrowthLog,
  exportTreeLogs,
} = require('../controllers/growthLogController');

// Tree routes
router.get('/', protect, getTrees);
router.get('/stats', protect, getTreeStats);
router.get('/:id', protect, getTreeById);
router.post('/', protect, upload.single('photo'), createTree);
router.put('/:id', protect, upload.single('photo'), updateTree);
router.delete('/:id', protect, deleteTree);

// Nested tree logs & export routes (plan.md Section 5.3)
router.get('/:treeId/logs', protect, (req, res, next) => {
  req.query.tree = req.params.treeId;
  return getGrowthLogs(req, res, next);
});

router.post('/:treeId/logs', protect, upload.single('photo'), (req, res, next) => {
  req.body.tree = req.params.treeId;
  return createGrowthLog(req, res, next);
});

router.get('/:treeId/export', protect, exportTreeLogs);

module.exports = router;
