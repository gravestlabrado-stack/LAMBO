const mongoose = require('mongoose');
const GrowthLog = require('../models/GrowthLog');
const Tree = require('../models/Tree');
const { uploadBufferToCloudinary } = require('../config/cloudinary');

/**
 * @desc    Get growth logs (filtered by tree or student)
 * @route   GET /api/growth-logs
 * @access  Private
 */
const getGrowthLogs = async (req, res, next) => {
  try {
    const {
      tree: treeParam,
      limit = 100,
      page = 1,
      sortBy = 'loggedAt',
      order = 'desc',
    } = req.query;

    const query = {};

    if (treeParam) {
      // Find tree by ObjectId or by treeId string (e.g. LMB-0001)
      let treeDoc;
      if (mongoose.Types.ObjectId.isValid(treeParam)) {
        treeDoc = await Tree.findById(treeParam);
      } else {
        treeDoc = await Tree.findOne({ treeId: treeParam.toUpperCase() });
      }

      if (treeDoc) {
        query.tree = treeDoc._id;
      } else {
        return res.status(200).json({ success: true, count: 0, data: [] });
      }
    } else {
      // If no tree specified, fetch logs created by this student or for trees owned by this student
      query.loggedBy = req.user._id;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const sortOrder = order === 'asc' ? 1 : -1;

    const [logs, total] = await Promise.all([
      GrowthLog.find(query)
        .populate('tree', 'treeId species nickname healthStatus currentStage')
        .populate('loggedBy', 'name rollNumber course')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      GrowthLog.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      count: logs.length,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
      data: logs,
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
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid log ID format',
      });
    }

    const log = await GrowthLog.findById(id)
      .populate('tree', 'treeId species nickname healthStatus currentStage coordinates location')
      .populate('loggedBy', 'name rollNumber course');

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Growth log entry not found',
      });
    }

    res.status(200).json({
      success: true,
      data: log,
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
    const {
      tree: treeParam,
      height,
      stemDiameter,
      leafCount,
      fruitCount,
      growthStage,
      healthStatus,
      notes,
      loggedAt,
    } = req.body;

    if (!treeParam) {
      return res.status(400).json({
        success: false,
        message: 'Tree identifier is required',
      });
    }

    if (height === undefined || height === null || isNaN(parseFloat(height))) {
      return res.status(400).json({
        success: false,
        message: 'Height measurement (cm) is required and must be a number',
      });
    }

    // Resolve tree by ObjectId or by treeId string (e.g. LMB-0001)
    let targetTree;
    if (mongoose.Types.ObjectId.isValid(treeParam)) {
      targetTree = await Tree.findById(treeParam);
    }
    if (!targetTree) {
      targetTree = await Tree.findOne({ treeId: String(treeParam).toUpperCase() });
    }

    if (!targetTree) {
      return res.status(404).json({
        success: false,
        message: `Tree not found for identifier ${treeParam}`,
      });
    }

    // Handle photo upload if present
    let photoUrl = req.body.photo || null;
    if (req.file) {
      const uploadRes = await uploadBufferToCloudinary(req.file.buffer, 'lambo_logs');
      photoUrl = uploadRes.url;
    }

    const log = await GrowthLog.create({
      tree: targetTree._id,
      loggedBy: req.user._id,
      height: parseFloat(height),
      stemDiameter: stemDiameter ? parseFloat(stemDiameter) : null,
      leafCount: leafCount ? parseInt(leafCount, 10) : null,
      fruitCount: fruitCount ? parseInt(fruitCount, 10) : null,
      growthStage: growthStage || targetTree.currentStage || 'Seedling',
      healthStatus: healthStatus || targetTree.healthStatus || 'Healthy',
      photo: photoUrl,
      notes: notes ? notes.trim() : '',
      loggedAt: loggedAt ? new Date(loggedAt) : new Date(),
    });

    // Update parent tree's status with latest observation metrics
    if (growthStage) {
      targetTree.currentStage = growthStage;
    }
    if (healthStatus) {
      targetTree.healthStatus = healthStatus;
    }
    if (photoUrl) {
      targetTree.photos.push({
        url: photoUrl,
        caption: `Observation log on ${new Date().toLocaleDateString()}`,
        uploadedAt: new Date(),
      });
    }
    await targetTree.save();

    const populated = await GrowthLog.findById(log._id)
      .populate('tree', 'treeId species nickname healthStatus currentStage')
      .populate('loggedBy', 'name rollNumber course');

    res.status(201).json({
      success: true,
      message: 'Growth log entry recorded successfully',
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a growth log entry
 * @route   PUT /api/growth-logs/:id
 * @access  Private
 */
const updateGrowthLog = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid log ID format',
      });
    }

    const log = await GrowthLog.findById(id);

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Growth log not found',
      });
    }

    // Verify ownership
    if (log.loggedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this log entry',
      });
    }

    const { height, stemDiameter, leafCount, fruitCount, growthStage, healthStatus, notes, loggedAt } =
      req.body;

    if (height !== undefined) log.height = parseFloat(height);
    if (stemDiameter !== undefined) log.stemDiameter = parseFloat(stemDiameter);
    if (leafCount !== undefined) log.leafCount = parseInt(leafCount, 10);
    if (fruitCount !== undefined) log.fruitCount = parseInt(fruitCount, 10);
    if (growthStage) log.growthStage = growthStage;
    if (healthStatus) log.healthStatus = healthStatus;
    if (notes !== undefined) log.notes = notes.trim();
    if (loggedAt) log.loggedAt = new Date(loggedAt);

    if (req.file) {
      const uploadRes = await uploadBufferToCloudinary(req.file.buffer, 'lambo_logs');
      log.photo = uploadRes.url;
    }

    await log.save();

    const updated = await GrowthLog.findById(log._id)
      .populate('tree', 'treeId species nickname')
      .populate('loggedBy', 'name rollNumber course');

    res.status(200).json({
      success: true,
      message: 'Growth log updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a growth log entry
 * @route   DELETE /api/growth-logs/:id
 * @access  Private
 */
const deleteGrowthLog = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid log ID format',
      });
    }

    const log = await GrowthLog.findById(id);

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Growth log not found',
      });
    }

    if (log.loggedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this log entry',
      });
    }

    await log.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Growth log entry removed successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export growth logs for a tree (formatted for spreadsheet / CSV generation)
 * @route   GET /api/growth-logs/export/:treeId
 * @access  Private
 */
const exportTreeLogs = async (req, res, next) => {
  try {
    const { treeId } = req.params;

    let treeDoc;
    if (mongoose.Types.ObjectId.isValid(treeId)) {
      treeDoc = await Tree.findById(treeId);
    } else {
      treeDoc = await Tree.findOne({ treeId: treeId.toUpperCase() });
    }

    if (!treeDoc) {
      return res.status(404).json({
        success: false,
        message: `Tree not found for identifier ${treeId}`,
      });
    }

    const logs = await GrowthLog.find({ tree: treeDoc._id })
      .populate('loggedBy', 'name rollNumber course')
      .sort({ loggedAt: 1 })
      .lean();

    const formattedExport = logs.map((log) => ({
      date: new Date(log.loggedAt).toISOString().split('T')[0],
      treeId: treeDoc.treeId,
      species: treeDoc.species,
      nickname: treeDoc.nickname || '',
      heightCm: log.height,
      stemDiameterCm: log.stemDiameter !== null ? log.stemDiameter : '',
      leafCount: log.leafCount !== null ? log.leafCount : '',
      fruitCount: log.fruitCount !== null ? log.fruitCount : '',
      stage: log.growthStage,
      healthStatus: log.healthStatus,
      recordedBy: log.loggedBy ? `${log.loggedBy.name} (${log.loggedBy.rollNumber})` : 'Unknown',
      notes: log.notes || '',
      photoUrl: log.photo || '',
    }));

    res.status(200).json({
      success: true,
      treeId: treeDoc.treeId,
      species: treeDoc.species,
      totalEntries: formattedExport.length,
      data: formattedExport,
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
  exportTreeLogs,
};
