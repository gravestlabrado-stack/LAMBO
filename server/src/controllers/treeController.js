const treeService = require('../services/treeService');

/**
 * @desc    Get all trees (filtered by user or query params)
 * @route   GET /api/trees
 * @access  Private
 */
const getTrees = async (req, res, next) => {
  try {
    const { species, healthStatus, status, search, all, page = 1, limit = 50, sortBy = 'createdAt', order = 'desc' } = req.query;

    const result = await treeService.getTrees({
      userId: req.user._id,
      isAll: all === 'true',
      species,
      healthStatus,
      status,
      search,
      page,
      limit,
      sortBy,
      order,
    });

    res.status(200).json({
      success: true,
      count: result.trees.length,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      data: result.trees,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get telemetry metrics & vitality overview
 * @route   GET /api/trees/stats
 * @access  Private
 */
const getTreeStats = async (req, res, next) => {
  try {
    const stats = await treeService.getTreeStats(req.user._id);
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single tree by ID or treeId (e.g., LMB-0001)
 * @route   GET /api/trees/:id
 * @access  Private
 */
const getTreeById = async (req, res, next) => {
  try {
    const tree = await treeService.getTreeById(req.params.id);
    if (!tree) {
      return res.status(404).json({
        success: false,
        message: `Tree not found with ID ${req.params.id}`,
      });
    }

    res.status(200).json({
      success: true,
      data: tree,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Register a new tree
 * @route   POST /api/trees
 * @access  Private
 */
const createTree = async (req, res, next) => {
  try {
    if (!req.body.species) {
      return res.status(400).json({
        success: false,
        message: 'Species is required',
      });
    }

    const tree = await treeService.createTree({
      userId: req.user._id,
      data: req.body,
      photoBuffer: req.file ? req.file.buffer : null,
    });

    res.status(201).json({
      success: true,
      message: `Tree ${tree.treeId} registered successfully`,
      data: tree,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update tree details
 * @route   PUT /api/trees/:id
 * @access  Private
 */
const updateTree = async (req, res, next) => {
  try {
    const result = await treeService.updateTree({
      id: req.params.id,
      userId: req.user._id,
      data: req.body,
      photoBuffer: req.file ? req.file.buffer : null,
    });

    if (result.status !== 200) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tree updated successfully',
      data: result.tree,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete tree and associated logs
 * @route   DELETE /api/trees/:id
 * @access  Private
 */
const deleteTree = async (req, res, next) => {
  try {
    const result = await treeService.deleteTree({
      id: req.params.id,
      userId: req.user._id,
    });

    if (result.status !== 200) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    }

    res.status(200).json({
      success: true,
      message: `Tree ${result.treeId} and associated observation logs deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTrees,
  getTreeStats,
  getTreeById,
  createTree,
  updateTree,
  deleteTree,
};
