const mongoose = require('mongoose');
const Tree = require('../models/Tree');
const GrowthLog = require('../models/GrowthLog');
const generateTreeId = require('../utils/generateTreeId');
const { uploadBufferToCloudinary } = require('../config/cloudinary');

/**
 * @desc    Get all trees (filtered by current user or query params)
 * @route   GET /api/trees
 * @access  Private
 */
const getTrees = async (req, res, next) => {
  try {
    const {
      species,
      healthStatus,
      status,
      search,
      all,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const query = {};

    // By default, students see their own trees unless `all=true` is specified (e.g., for campus map)
    if (all !== 'true') {
      query.owner = req.user._id;
    }

    if (species) {
      query.species = new RegExp(species, 'i');
    }

    if (healthStatus) {
      query.healthStatus = healthStatus;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { treeId: searchRegex },
        { species: searchRegex },
        { nickname: searchRegex },
        { location: searchRegex },
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const sortOrder = order === 'asc' ? 1 : -1;

    const [trees, total] = await Promise.all([
      Tree.find(query)
        .populate('owner', 'name rollNumber course avatar')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      Tree.countDocuments(query),
    ]);

    // Attach latest growth log summary to each tree
    const treeIds = trees.map((t) => t._id);
    const latestLogs = await GrowthLog.aggregate([
      { $match: { tree: { $in: treeIds } } },
      { $sort: { loggedAt: -1 } },
      {
        $group: {
          _id: '$tree',
          latestHeight: { $first: '$height' },
          latestLogDate: { $first: '$loggedAt' },
          totalLogs: { $sum: 1 },
        },
      },
    ]);

    const logsMap = new Map();
    latestLogs.forEach((item) => logsMap.set(String(item._id), item));

    const enrichedTrees = trees.map((tree) => {
      const logInfo = logsMap.get(String(tree._id));
      return {
        ...tree,
        latestHeight: logInfo ? logInfo.latestHeight : null,
        latestLogDate: logInfo ? logInfo.latestLogDate : null,
        totalLogs: logInfo ? logInfo.totalLogs : 0,
      };
    });

    res.status(200).json({
      success: true,
      count: enrichedTrees.length,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
      data: enrichedTrees,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get dashboard metrics & telemetry overview
 * @route   GET /api/trees/stats
 * @access  Private
 */
const getTreeStats = async (req, res, next) => {
  try {
    const ownerId = req.user._id;

    const [totalTrees, healthyCount, monitoringCount, attentionCount, totalLogs, speciesStats] =
      await Promise.all([
        Tree.countDocuments({ owner: ownerId }),
        Tree.countDocuments({ owner: ownerId, healthStatus: 'Healthy' }),
        Tree.countDocuments({ owner: ownerId, healthStatus: 'Monitoring' }),
        Tree.countDocuments({ owner: ownerId, healthStatus: 'Needs Attention' }),
        GrowthLog.countDocuments({ loggedBy: ownerId }),
        Tree.aggregate([
          { $match: { owner: ownerId } },
          { $group: { _id: '$species', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 6 },
        ]),
      ]);

    const healthRate = totalTrees > 0 ? Math.round((healthyCount / totalTrees) * 100) : 100;

    res.status(200).json({
      success: true,
      data: {
        totalTrees,
        healthRate,
        breakdown: {
          healthy: healthyCount,
          monitoring: monitoringCount,
          needsAttention: attentionCount,
        },
        totalLogs,
        speciesDistribution: speciesStats.map((s) => ({
          species: s._id,
          count: s.count,
        })),
      },
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
    const { id } = req.params;

    // Search by ObjectId if valid, otherwise search by treeId
    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { treeId: id.toUpperCase() }] };
    } else {
      query = { treeId: id.toUpperCase() };
    }

    const tree = await Tree.findOne(query).populate('owner', 'name rollNumber course avatar');

    if (!tree) {
      return res.status(404).json({
        success: false,
        message: `Tree not found with ID ${id}`,
      });
    }

    // Fetch growth logs for this tree sorted chronologically
    const logs = await GrowthLog.find({ tree: tree._id })
      .populate('loggedBy', 'name rollNumber')
      .sort({ loggedAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        ...tree.toObject(),
        growthLogs: logs,
      },
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
    const {
      species,
      nickname,
      location,
      lat,
      lng,
      datePlanted,
      healthStatus,
      currentStage,
      initialHeight,
      initialStemDiameter,
      initialLeafCount,
      notes,
    } = req.body;

    if (!species) {
      return res.status(400).json({
        success: false,
        message: 'Species is required',
      });
    }

    // Auto-generate sequential tree ID
    const treeId = await generateTreeId();

    // Handle photo upload to Cloudinary if image file uploaded
    let photoUrl = req.body.photoUrl || '';
    if (req.file) {
      const uploadResult = await uploadBufferToCloudinary(req.file.buffer, 'lambo_trees');
      photoUrl = uploadResult.url;
    }

    const photos = [];
    if (photoUrl) {
      photos.push({
        url: photoUrl,
        caption: 'Baseline seedling photo',
        uploadedAt: new Date(),
      });
    }

    // Construct coordinates
    const coordinates = {
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
    };

    const newTree = await Tree.create({
      treeId,
      owner: req.user._id,
      species: species.trim(),
      nickname: nickname ? nickname.trim() : '',
      location: location ? location.trim() : '',
      coordinates,
      datePlanted: datePlanted ? new Date(datePlanted) : new Date(),
      healthStatus: healthStatus || 'Healthy',
      currentStage: currentStage || 'Seedling',
      photos,
      status: 'alive',
    });

    // If initial baseline morphometrics provided, automatically create baseline growth log
    if (initialHeight) {
      await GrowthLog.create({
        tree: newTree._id,
        loggedBy: req.user._id,
        height: parseFloat(initialHeight),
        stemDiameter: initialStemDiameter ? parseFloat(initialStemDiameter) : null,
        leafCount: initialLeafCount ? parseInt(initialLeafCount, 10) : null,
        growthStage: currentStage || 'Seedling',
        healthStatus: healthStatus || 'Healthy',
        photo: photoUrl || null,
        notes: notes ? notes.trim() : 'Initial baseline seedling registration measurement',
        loggedAt: datePlanted ? new Date(datePlanted) : new Date(),
      });
    }

    const populatedTree = await Tree.findById(newTree._id).populate(
      'owner',
      'name rollNumber course avatar'
    );

    res.status(201).json({
      success: true,
      message: `Tree ${treeId} registered successfully`,
      data: populatedTree,
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
    const { id } = req.params;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { treeId: id.toUpperCase() }] }
      : { treeId: id.toUpperCase() };

    let tree = await Tree.findOne(query);

    if (!tree) {
      return res.status(404).json({
        success: false,
        message: `Tree not found with ID ${id}`,
      });
    }

    // Verify ownership
    if (tree.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this tree record',
      });
    }

    const {
      species,
      nickname,
      location,
      lat,
      lng,
      status,
      healthStatus,
      currentStage,
      datePlanted,
    } = req.body;

    if (species) tree.species = species.trim();
    if (nickname !== undefined) tree.nickname = nickname.trim();
    if (location !== undefined) tree.location = location.trim();
    if (status) tree.status = status;
    if (healthStatus) tree.healthStatus = healthStatus;
    if (currentStage) tree.currentStage = currentStage;
    if (datePlanted) tree.datePlanted = new Date(datePlanted);

    if (lat !== undefined && lng !== undefined) {
      tree.coordinates = {
        lat: lat ? parseFloat(lat) : null,
        lng: lng ? parseFloat(lng) : null,
      };
    }

    // If new photo uploaded
    if (req.file) {
      const uploadResult = await uploadBufferToCloudinary(req.file.buffer, 'lambo_trees');
      tree.photos.push({
        url: uploadResult.url,
        caption: req.body.caption || 'Field observation photo',
        uploadedAt: new Date(),
      });
    }

    await tree.save();

    const updated = await Tree.findById(tree._id).populate('owner', 'name rollNumber course avatar');

    res.status(200).json({
      success: true,
      message: 'Tree updated successfully',
      data: updated,
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
    const { id } = req.params;

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { treeId: id.toUpperCase() }] }
      : { treeId: id.toUpperCase() };

    const tree = await Tree.findOne(query);

    if (!tree) {
      return res.status(404).json({
        success: false,
        message: `Tree not found with ID ${id}`,
      });
    }

    // Verify ownership
    if (tree.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this tree record',
      });
    }

    // Cascade delete associated growth logs
    await GrowthLog.deleteMany({ tree: tree._id });
    await tree.deleteOne();

    res.status(200).json({
      success: true,
      message: `Tree ${tree.treeId} and associated observation logs deleted successfully`,
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
