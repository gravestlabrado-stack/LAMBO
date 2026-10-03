const mongoose = require('mongoose');
const GrowthLog = require('../models/GrowthLog');
const Tree = require('../models/Tree');
const mediaService = require('./mediaService');

/**
 * Domain Service for Botanical Growth Observation Logs
 */
class GrowthLogService {
  /**
   * Fetch growth logs with pagination, filtering by tree or user
   */
  async getGrowthLogs({ treeParam, userId, limit = 100, page = 1, sortBy = 'loggedAt', order = 'desc' }) {
    const query = {};

    if (treeParam) {
      const treeDoc = mongoose.Types.ObjectId.isValid(treeParam)
        ? await Tree.findById(treeParam)
        : await Tree.findOne({ treeId: treeParam.toUpperCase() });

      if (treeDoc) {
        query.tree = treeDoc._id;
      } else {
        return { logs: [], total: 0, page: 1, totalPages: 0 };
      }
    } else {
      query.loggedBy = userId;
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;
    const sortOrder = order === 'asc' ? 1 : -1;

    const [logs, total] = await Promise.all([
      GrowthLog.find(query)
        .populate('tree', 'treeId species nickname healthStatus currentStage')
        .populate('loggedBy', 'name rollNumber course')
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      GrowthLog.countDocuments(query),
    ]);

    return {
      logs,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    };
  }

  /**
   * Fetch a single growth observation by ID
   */
  async getGrowthLogById(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return { status: 400, message: 'Invalid log ID format' };
    }

    const log = await GrowthLog.findById(id)
      .populate('tree', 'treeId species nickname healthStatus currentStage coordinates location')
      .populate('loggedBy', 'name rollNumber course');

    if (!log) {
      return { status: 404, message: 'Growth log entry not found' };
    }

    return { status: 200, log };
  }

  /**
   * Create an observation log with mandatory photo verification and delta calculation
   */
  async createGrowthLog({ userId, userRole, data, photoBuffer }) {
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
    } = data;

    if (!treeParam) {
      return { status: 400, message: 'Tree identifier is required' };
    }

    if (height === undefined || height === null || isNaN(parseFloat(height))) {
      return { status: 400, message: 'Height measurement (cm) is required and must be a number' };
    }

    // Resolve tree document
    const targetTree = mongoose.Types.ObjectId.isValid(treeParam)
      ? await Tree.findById(treeParam)
      : await Tree.findOne({ treeId: treeParam.toUpperCase() });

    if (!targetTree) {
      return { status: 404, message: `Tree not found with identifier ${treeParam}` };
    }

    // Authorization: Owner or Officer
    const isOwner = targetTree.owner.toString() === userId.toString();
    const isOfficer = userRole === 'officer';
    if (!isOwner && !isOfficer) {
      return { status: 403, message: 'Not authorized to log observations for this tree' };
    }

    // Mandatory photographic verification
    let photoUrl = data.photo || '';
    if (photoBuffer) {
      const uploadResult = await mediaService.uploadImage(photoBuffer, 'lambo_growth_logs');
      photoUrl = uploadResult.url;
    }

    if (!photoUrl) {
      return { status: 400, message: 'Visual photographic evidence is mandatory for all observation entries.' };
    }

    // Calculate sequential growth deltas against previous observation
    const previousLog = await GrowthLog.findOne({ tree: targetTree._id }).sort({ loggedAt: -1 });

    const currentHeight = parseFloat(height);
    const currentStem = stemDiameter ? parseFloat(stemDiameter) : null;
    let heightDelta = null;
    let stemDelta = null;

    if (previousLog) {
      heightDelta = Math.round((currentHeight - previousLog.height) * 10) / 10;
      if (currentStem && previousLog.stemDiameter) {
        stemDelta = Math.round((currentStem - previousLog.stemDiameter) * 10) / 10;
      }
    }

    const observationDate = loggedAt ? new Date(loggedAt) : new Date();

    const newLog = await GrowthLog.create({
      tree: targetTree._id,
      loggedBy: userId,
      height: currentHeight,
      stemDiameter: currentStem,
      leafCount: leafCount ? parseInt(leafCount, 10) : null,
      fruitCount: fruitCount ? parseInt(fruitCount, 10) : null,
      growthStage: growthStage || targetTree.currentStage,
      healthStatus: healthStatus || targetTree.healthStatus,
      photo: photoUrl,
      notes: notes ? notes.trim() : '',
      loggedAt: observationDate,
    });

    // Synchronize latest telemetry with Tree specimen record
    const isLatestLog = !previousLog || observationDate >= previousLog.loggedAt;
    if (isLatestLog) {
      if (growthStage) targetTree.currentStage = growthStage;
      if (healthStatus) {
        targetTree.healthStatus = healthStatus;
        targetTree.status = (healthStatus === 'Dead / Mortality') ? 'dead' : 'alive';
      }
      targetTree.photos.push({
        url: photoUrl,
        caption: `Growth Observation (${new Date(observationDate).toLocaleDateString()})`,
        uploadedAt: new Date(),
      });
      await targetTree.save();
    }

    const populatedLog = await GrowthLog.findById(newLog._id)
      .populate('tree', 'treeId species nickname healthStatus currentStage')
      .populate('loggedBy', 'name rollNumber course');

    return {
      status: 201,
      log: {
        ...populatedLog.toObject(),
        deltas: { heightDelta, stemDelta },
      },
    };
  }

  /**
   * Update an observation log
   */
  async updateGrowthLog({ id, userId, userRole, data, photoBuffer }) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return { status: 400, message: 'Invalid log ID format' };
    }

    const log = await GrowthLog.findById(id);
    if (!log) {
      return { status: 404, message: 'Growth log entry not found' };
    }

    const isCreator = log.loggedBy.toString() === userId.toString();
    const isOfficer = userRole === 'officer';
    if (!isCreator && !isOfficer) {
      return { status: 403, message: 'Not authorized to edit this observation entry' };
    }

    const { height, stemDiameter, leafCount, fruitCount, growthStage, healthStatus, notes, loggedAt } = data;

    if (height !== undefined) {
      const parsedH = parseFloat(height);
      if (isNaN(parsedH)) return { status: 400, message: 'Height must be a valid number' };
      log.height = parsedH;
    }

    if (stemDiameter !== undefined) log.stemDiameter = stemDiameter ? parseFloat(stemDiameter) : null;
    if (leafCount !== undefined) log.leafCount = leafCount ? parseInt(leafCount, 10) : null;
    if (fruitCount !== undefined) log.fruitCount = fruitCount ? parseInt(fruitCount, 10) : null;
    if (growthStage) log.growthStage = growthStage;
    if (healthStatus) log.healthStatus = healthStatus;
    if (notes !== undefined) log.notes = notes.trim();
    if (loggedAt) log.loggedAt = new Date(loggedAt);

    if (photoBuffer) {
      const uploadResult = await mediaService.uploadImage(photoBuffer, 'lambo_growth_logs');
      log.photo = uploadResult.url;
    }

    await log.save();

    const updated = await GrowthLog.findById(log._id)
      .populate('tree', 'treeId species nickname healthStatus currentStage')
      .populate('loggedBy', 'name rollNumber course');

    return { status: 200, log: updated };
  }

  /**
   * Delete an observation log
   */
  async deleteGrowthLog({ id, userId, userRole }) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return { status: 400, message: 'Invalid log ID format' };
    }

    const log = await GrowthLog.findById(id);
    if (!log) {
      return { status: 404, message: 'Growth log entry not found' };
    }

    const isCreator = log.loggedBy.toString() === userId.toString();
    const isOfficer = userRole === 'officer';
    if (!isCreator && !isOfficer) {
      return { status: 403, message: 'Not authorized to delete this observation entry' };
    }

    await log.deleteOne();

    return { status: 200, logId: id };
  }

  /**
   * Fetch growth analytics and chronological trend curves for a specimen
   */
  async getTreeGrowthAnalytics(treeParam) {
    const treeDoc = mongoose.Types.ObjectId.isValid(treeParam)
      ? await Tree.findById(treeParam)
      : await Tree.findOne({ treeId: treeParam.toUpperCase() });

    if (!treeDoc) {
      return { status: 404, message: 'Tree not found' };
    }

    const logs = await GrowthLog.find({ tree: treeDoc._id })
      .populate('loggedBy', 'name rollNumber')
      .sort({ loggedAt: 1 })
      .lean();

    const timeline = logs.map((log, index) => {
      let heightDelta = 0;
      let daysSinceLastLog = null;

      if (index > 0) {
        heightDelta = Math.round((log.height - logs[index - 1].height) * 10) / 10;
        const diffMs = new Date(log.loggedAt) - new Date(logs[index - 1].loggedAt);
        daysSinceLastLog = Math.round(diffMs / (1000 * 60 * 60 * 24));
      }

      return {
        _id: log._id,
        date: log.loggedAt,
        height: log.height,
        stemDiameter: log.stemDiameter,
        leafCount: log.leafCount,
        fruitCount: log.fruitCount,
        growthStage: log.growthStage,
        healthStatus: log.healthStatus,
        heightDelta,
        daysSinceLastLog,
        photo: log.photo,
        loggedBy: log.loggedBy,
      };
    });

    const totalHeightGain = logs.length > 1
      ? Math.round((logs[logs.length - 1].height - logs[0].height) * 10) / 10
      : 0;

    return {
      status: 200,
      analytics: {
        tree: {
          id: treeDoc._id,
          treeId: treeDoc.treeId,
          species: treeDoc.species,
          nickname: treeDoc.nickname,
          currentStage: treeDoc.currentStage,
          healthStatus: treeDoc.healthStatus,
        },
        totalLogs: logs.length,
        totalHeightGain,
        timeline,
      },
    };
  }
}

module.exports = new GrowthLogService();
