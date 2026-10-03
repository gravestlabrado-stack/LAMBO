const mongoose = require('mongoose');
const Tree = require('../models/Tree');
const GrowthLog = require('../models/GrowthLog');
const generateTreeId = require('../utils/generateTreeId');
const mediaService = require('./mediaService');

/**
 * Domain Service for Botanical Tree Specimens
 */
class TreeService {
  /**
   * Fetch trees matching query filters with latest growth telemetry
   */
  async getTrees({ userId, isAll, species, healthStatus, status, search, page = 1, limit = 50, sortBy = 'createdAt', order = 'desc' }) {
    const query = {};

    // Students only view their own trees unless campus-wide view (isAll=true)
    if (!isAll) {
      query.owner = userId;
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

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const sortOrder = order === 'asc' ? 1 : -1;

    const [trees, total] = await Promise.all([
      Tree.find(query)
        .populate('owner', 'name rollNumber course avatar')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Tree.countDocuments(query),
    ]);

    // Aggregate and enrich each tree with its latest growth log summary
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

    return {
      trees: enrichedTrees,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  /**
   * Calculate personal tree metrics, survival rates, and species distributions
   */
  async getTreeStats(ownerId) {
    const [
      totalTrees,
      thrivingCount,
      fairCount,
      distressedCount,
      mortalityCount,
      totalLogs,
      speciesStats,
    ] = await Promise.all([
      Tree.countDocuments({ owner: ownerId }),
      Tree.countDocuments({ owner: ownerId, healthStatus: { $in: ['Thriving', 'Healthy'] } }),
      Tree.countDocuments({ owner: ownerId, healthStatus: { $in: ['Stable / Fair', 'Monitoring'] } }),
      Tree.countDocuments({ owner: ownerId, healthStatus: { $in: ['Distressed / At Risk', 'Needs Attention'] } }),
      Tree.countDocuments({
        owner: ownerId,
        $or: [{ healthStatus: 'Dead / Mortality' }, { status: 'dead' }],
      }),
      GrowthLog.countDocuments({ loggedBy: ownerId }),
      Tree.aggregate([
        { $match: { owner: ownerId } },
        { $group: { _id: '$species', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),
    ]);

    const livingTrees = totalTrees - mortalityCount;
    const healthRate = totalTrees > 0 ? Math.round((thrivingCount / totalTrees) * 100) : 100;
    const survivalRate = totalTrees > 0 ? Math.round((livingTrees / totalTrees) * 100) : 100;

    return {
      totalTrees,
      healthRate,
      survivalRate,
      breakdown: {
        thriving: thrivingCount,
        fair: fairCount,
        distressed: distressedCount,
        mortality: mortalityCount,
        healthy: thrivingCount,
        monitoring: fairCount,
        needsAttention: distressedCount,
      },
      totalLogs,
      speciesDistribution: speciesStats.map((s) => ({
        species: s._id,
        count: s.count,
      })),
    };
  }

  /**
   * Find a single tree by Mongo ObjectId or human-readable TreeId (e.g. LMB-0001)
   */
  async getTreeById(id) {
    let query;
    if (mongoose.Types.ObjectId.isValid(id)) {
      query = { $or: [{ _id: id }, { treeId: id.toUpperCase() }] };
    } else {
      query = { treeId: id.toUpperCase() };
    }

    const tree = await Tree.findOne(query).populate('owner', 'name rollNumber course avatar');
    if (!tree) return null;

    const logs = await GrowthLog.find({ tree: tree._id })
      .populate('loggedBy', 'name rollNumber')
      .sort({ loggedAt: -1 });

    return {
      ...tree.toObject(),
      growthLogs: logs,
    };
  }

  /**
   * Register a new wildling tree specimen
   */
  async createTree({ userId, data, photoBuffer }) {
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
    } = data;

    const treeId = await generateTreeId();

    let photoUrl = data.photoUrl || '';
    if (photoBuffer) {
      const uploadResult = await mediaService.uploadImage(photoBuffer, 'lambo_trees');
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

    const coordinates = {
      lat: lat ? parseFloat(lat) : null,
      lng: lng ? parseFloat(lng) : null,
    };

    const newTree = await Tree.create({
      treeId,
      owner: userId,
      species: species.trim(),
      nickname: nickname ? nickname.trim() : '',
      location: location ? location.trim() : '',
      coordinates,
      datePlanted: datePlanted ? new Date(datePlanted) : new Date(),
      healthStatus: healthStatus || 'Thriving',
      currentStage: currentStage || 'Seedling',
      photos,
      status: (healthStatus === 'Dead / Mortality') ? 'dead' : 'alive',
    });

    // If initial baseline height provided, automatically log baseline observation
    if (initialHeight) {
      await GrowthLog.create({
        tree: newTree._id,
        loggedBy: userId,
        height: parseFloat(initialHeight),
        stemDiameter: initialStemDiameter ? parseFloat(initialStemDiameter) : null,
        leafCount: initialLeafCount ? parseInt(initialLeafCount, 10) : null,
        growthStage: currentStage || 'Seedling',
        healthStatus: healthStatus || 'Thriving',
        photo: photoUrl || (photos.length > 0 ? photos[0].url : 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop&q=80'),
        notes: notes ? notes.trim() : 'Initial baseline seedling registration measurement',
        loggedAt: datePlanted ? new Date(datePlanted) : new Date(),
      });
    }

    return Tree.findById(newTree._id).populate('owner', 'name rollNumber course avatar');
  }

  /**
   * Update an existing tree specimen
   */
  async updateTree({ id, userId, data, photoBuffer }) {
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { treeId: id.toUpperCase() }] }
      : { treeId: id.toUpperCase() };

    const tree = await Tree.findOne(query);
    if (!tree) return { status: 404, message: `Tree not found with ID ${id}` };

    if (tree.owner.toString() !== userId.toString()) {
      return { status: 403, message: 'Not authorized to modify this tree record' };
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
      caption,
    } = data;

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

    if (photoBuffer) {
      const uploadResult = await mediaService.uploadImage(photoBuffer, 'lambo_trees');
      tree.photos.push({
        url: uploadResult.url,
        caption: caption || 'Field observation photo',
        uploadedAt: new Date(),
      });
    }

    await tree.save();

    const updated = await Tree.findById(tree._id).populate('owner', 'name rollNumber course avatar');
    return { status: 200, tree: updated };
  }

  /**
   * Delete tree and cascade delete associated growth observations
   */
  async deleteTree({ id, userId }) {
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { treeId: id.toUpperCase() }] }
      : { treeId: id.toUpperCase() };

    const tree = await Tree.findOne(query);
    if (!tree) return { status: 404, message: `Tree not found with ID ${id}` };

    if (tree.owner.toString() !== userId.toString()) {
      return { status: 403, message: 'Not authorized to delete this tree record' };
    }

    await GrowthLog.deleteMany({ tree: tree._id });
    await tree.deleteOne();

    return { status: 200, treeId: tree.treeId };
  }
}

module.exports = new TreeService();
