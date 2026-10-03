const growthLogService = require('../services/growthLogService');

/**
 * @desc    Get growth logs (filtered by tree or student)
 * @route   GET /api/growth-logs
 * @access  Private
 */
const getGrowthLogs = async (req, res, next) => {
  try {
    const { tree: treeParam, limit = 100, page = 1, sortBy = 'loggedAt', order = 'desc' } = req.query;

    const result = await growthLogService.getGrowthLogs({
      treeParam,
      userId: req.user._id,
      limit,
      page,
      sortBy,
      order,
    });

    res.status(200).json({
      success: true,
      count: result.logs.length,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      data: result.logs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single growth log by ID
 * @route   GET /api/growth-logs/:id
 * @access  Private
 */
const getGrowthLogById = async (req, res, next) => {
  try {
    const result = await growthLogService.getGrowthLogById(req.params.id);

    if (result.status !== 200) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    }

    res.status(200).json({
      success: true,
      data: result.log,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new growth log measurement entry
 * @route   POST /api/growth-logs
 * @access  Private
 */
const createGrowthLog = async (req, res, next) => {
  try {
    const result = await growthLogService.createGrowthLog({
      userId: req.user._id,
      userRole: req.user.role,
      data: req.body,
      photoBuffer: req.file ? req.file.buffer : null,
    });

    if (result.status !== 201) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Growth log recorded successfully',
      data: result.log,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing growth log
 * @route   PUT /api/growth-logs/:id
 * @access  Private
 */
const updateGrowthLog = async (req, res, next) => {
  try {
    const result = await growthLogService.updateGrowthLog({
      id: req.params.id,
      userId: req.user._id,
      userRole: req.user.role,
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
      message: 'Growth log updated successfully',
      data: result.log,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a growth log
 * @route   DELETE /api/growth-logs/:id
 * @access  Private
 */
const deleteGrowthLog = async (req, res, next) => {
  try {
    const result = await growthLogService.deleteGrowthLog({
      id: req.params.id,
      userId: req.user._id,
      userRole: req.user.role,
    });

    if (result.status !== 200) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Growth log deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get growth analytics & trend curves for a tree
 * @route   GET /api/growth-logs/analytics/:treeId
 * @access  Private
 */
const getTreeGrowthAnalytics = async (req, res, next) => {
  try {
    const result = await growthLogService.getTreeGrowthAnalytics(req.params.treeId);

    if (result.status !== 200) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    }

    res.status(200).json({
      success: true,
      data: result.analytics,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGrowthLogs,
  getGrowthLogById,
  createGrowthLog,
  updateGrowthLog,
  deleteGrowthLog,
  getTreeGrowthAnalytics,
};
