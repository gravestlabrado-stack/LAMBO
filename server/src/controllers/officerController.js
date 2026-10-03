const User = require('../models/User');
const Tree = require('../models/Tree');
const GrowthLog = require('../models/GrowthLog');

/**
 * @desc    Get complete cadet compliance roster with observation metrics
 * @route   GET /api/officer/roster
 * @access  Private (Officer only)
 */
const getCadetRoster = async (req, res, next) => {
  try {
    const students = await User.find({})
      .select('-password')
      .lean();

    // Prioritize officers at the top of the roster, followed by cadets
    students.sort((a, b) => {
      const aIsOfficer = a.role === 'officer' ? 1 : 0;
      const bIsOfficer = b.role === 'officer' ? 1 : 0;
      if (aIsOfficer !== bIsOfficer) {
        return bIsOfficer - aIsOfficer;
      }
      return (a.name || '').localeCompare(b.name || '');
    });

    const now = new Date();

    const roster = await Promise.all(
      students.map(async (student) => {
        const studentId = student._id;

        const [trees, logs] = await Promise.all([
          Tree.find({ owner: studentId }).lean(),
          GrowthLog.find({ loggedBy: studentId }).sort({ loggedAt: -1 }).lean(),
        ]);

        const totalTrees = trees.length;
        const deadTrees = trees.filter(
          (t) => t.status === 'dead' || t.healthStatus === 'Dead / Mortality'
        ).length;
        const aliveTrees = totalTrees - deadTrees;
        const totalLogs = logs.length;
        const latestLog = logs.length > 0 ? logs[0] : null;
        const lastLogDate = latestLog ? latestLog.loggedAt : null;

        let daysSinceLastLog = null;
        if (lastLogDate) {
          const diffMs = now.getTime() - new Date(lastLogDate).getTime();
          daysSinceLastLog = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        }

        let complianceStatus = 'Unassigned';
        if (totalTrees > 0) {
          if (daysSinceLastLog !== null && daysSinceLastLog <= 7) {
            complianceStatus = 'Active';
          } else if (daysSinceLastLog !== null && daysSinceLastLog <= 14) {
            complianceStatus = 'Overdue';
          } else {
            complianceStatus = 'Delinquent';
          }
        }

        return {
          id: student._id,
          name: student.name,
          rollNumber: student.rollNumber,
          role: student.role || 'student',
          course: student.course || 'Unspecified',
          phone: student.phone || '',
          avatar: student.avatar || '',
          enrolledAt: student.createdAt,
          totalTrees,
          aliveTrees,
          deadTrees,
          totalLogs,
          lastLogDate,
          daysSinceLastLog,
          complianceStatus,
          specimens: trees.map((t) => ({
            id: t._id,
            treeId: t.treeId,
            species: t.species,
            nickname: t.nickname,
            vitality: t.healthStatus,
            stage: t.currentStage,
            status: t.status,
            photo: t.photos && t.photos.length > 0 ? t.photos[0].url : null,
          })),
        };
      })
    );

    res.status(200).json({
      success: true,
      count: roster.length,
      data: roster,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed telemetry and photo audit for a single cadet
 * @route   GET /api/officer/cadet/:id
 * @access  Private (Officer only)
 */
const getCadetDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const cadet = await User.findById(id).select('-password').lean();
    if (!cadet) {
      return res.status(404).json({
        success: false,
        message: 'Cadet profile not found',
      });
    }

    const [trees, logs] = await Promise.all([
      Tree.find({ owner: id }).sort({ createdAt: -1 }).lean(),
      GrowthLog.find({ loggedBy: id })
        .populate('tree', 'treeId species nickname healthStatus location coordinates')
        .sort({ loggedAt: -1 })
        .lean(),
    ]);

    const deadCount = trees.filter(
      (t) => t.status === 'dead' || t.healthStatus === 'Dead / Mortality'
    ).length;

    res.status(200).json({
      success: true,
      data: {
        cadet,
        metrics: {
          totalTrees: trees.length,
          aliveTrees: trees.length - deadCount,
          deadTrees: deadCount,
          totalLogs: logs.length,
          survivalRate:
            trees.length > 0
              ? Math.round(((trees.length - deadCount) / trees.length) * 100)
              : 100,
        },
        trees,
        logs,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get macro campus overview statistics for NSTP administration
 * @route   GET /api/officer/stats
 * @access  Private (Officer only)
 */
const getOfficerSummaryStats = async (req, res, next) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [totalUsers, totalCadets, totalOfficers, totalTrees, deadTrees, totalLogs, recentLogs] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: { $ne: 'officer' } }),
      User.countDocuments({ role: 'officer' }),
      Tree.countDocuments(),
      Tree.countDocuments({
        $or: [{ status: 'dead' }, { healthStatus: 'Dead / Mortality' }],
      }),
      GrowthLog.countDocuments(),
      GrowthLog.find({ loggedAt: { $gte: sevenDaysAgo } }).distinct('loggedBy'),
    ]);

    const activeMemberCount = recentLogs.length;
    const livingTrees = totalTrees - deadTrees;
    const campusSurvivalRate =
      totalTrees > 0 ? Math.round((livingTrees / totalTrees) * 100) : 100;
    const activeRate =
      totalUsers > 0 ? Math.round((activeMemberCount / totalUsers) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalMembers: totalUsers,
        totalCadets: totalUsers,
        cadetsOnly: totalCadets,
        totalOfficers,
        activeCadets: activeMemberCount,
        activeRate,
        totalTrees,
        livingTrees,
        deadTrees,
        campusSurvivalRate,
        totalLogs,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCadetRoster,
  getCadetDetails,
  getOfficerSummaryStats,
};
