const User = require('../models/User');
const Tree = require('../models/Tree');
const GrowthLog = require('../models/GrowthLog');

/**
 * Domain Service for NSTP Officer Command & Cadets Oversight
 */
class OfficerService {
  /**
   * Calculate cadet compliance indicator based on observation latency
   */
  calculateCompliance(totalTrees, daysSinceLastLog) {
    if (totalTrees === 0) return 'Unassigned';
    if (daysSinceLastLog === null) return 'Delinquent';
    if (daysSinceLastLog <= 7) return 'Active';
    if (daysSinceLastLog <= 14) return 'Overdue';
    return 'Delinquent';
  }

  /**
   * Fetch complete cadet compliance roster with officer prioritization
   */
  async getCadetRoster() {
    const students = await User.find({}).select('-password').lean();

    // Prioritize officers at the top of the roster
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

        const complianceStatus = this.calculateCompliance(totalTrees, daysSinceLastLog);

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

    return roster;
  }

  /**
   * Drill-down inspection for a specific cadet
   */
  async getCadetInspection(cadetId) {
    const student = await User.findById(cadetId).select('-password').lean();
    if (!student) {
      return { status: 404, message: 'Cadet not found' };
    }

    const [trees, logs] = await Promise.all([
      Tree.find({ owner: cadetId }).lean(),
      GrowthLog.find({ loggedBy: cadetId })
        .populate('tree', 'treeId species nickname healthStatus')
        .sort({ loggedAt: -1 })
        .lean(),
    ]);

    const totalTrees = trees.length;
    const deadTrees = trees.filter(
      (t) => t.status === 'dead' || t.healthStatus === 'Dead / Mortality'
    ).length;
    const aliveTrees = totalTrees - deadTrees;
    const survivalRate = totalTrees > 0 ? Math.round((aliveTrees / totalTrees) * 100) : 100;

    return {
      status: 200,
      inspectionData: {
        cadet: {
          id: student._id,
          name: student.name,
          rollNumber: student.rollNumber,
          role: student.role,
          course: student.course,
          phone: student.phone,
          avatar: student.avatar,
          enrolledAt: student.createdAt,
        },
        survivalRate,
        totalTrees,
        aliveTrees,
        deadTrees,
        totalLogs: logs.length,
        specimens: trees,
        recentLogs: logs,
      },
    };
  }

  /**
   * Calculate cohort-wide summary KPIs for officers
   */
  async getCohortStats() {
    const [totalStudents, totalOfficers, allTrees, allLogs] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'officer' }),
      Tree.find({}).lean(),
      GrowthLog.find({}).lean(),
    ]);

    const totalTrees = allTrees.length;
    const deadTrees = allTrees.filter(
      (t) => t.status === 'dead' || t.healthStatus === 'Dead / Mortality'
    ).length;
    const thrivingTrees = allTrees.filter(
      (t) => t.healthStatus === 'Thriving' || t.healthStatus === 'Healthy'
    ).length;
    const aliveTrees = totalTrees - deadTrees;
    const cohortSurvivalRate = totalTrees > 0 ? Math.round((aliveTrees / totalTrees) * 100) : 100;

    return {
      totalCadets: totalStudents,
      totalOfficers,
      totalTrees,
      aliveTrees,
      deadTrees,
      thrivingTrees,
      cohortSurvivalRate,
      totalLogsRecorded: allLogs.length,
    };
  }
}

module.exports = new OfficerService();
