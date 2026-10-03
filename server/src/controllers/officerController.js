const officerService = require('../services/officerService');

/**
 * @desc    Get complete cadet compliance roster with observation metrics
 * @route   GET /api/officer/roster
 * @access  Private (Officer only)
 */
const getCadetRoster = async (req, res, next) => {
  try {
    const roster = await officerService.getCadetRoster();
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
 * @desc    Drill-down inspection of a single cadet's specimens & photo observation history
 * @route   GET /api/officer/cadet/:id
 * @access  Private (Officer only)
 */
const getCadetInspection = async (req, res, next) => {
  try {
    const result = await officerService.getCadetInspection(req.params.id);

    if (result.status !== 200) {
      return res.status(result.status).json({
        success: false,
        message: result.message,
      });
    }

    res.status(200).json({
      success: true,
      data: result.inspectionData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get aggregate cohort-wide summary statistics for officers
 * @route   GET /api/officer/cohort-stats
 * @access  Private (Officer only)
 */
const getCohortStats = async (req, res, next) => {
  try {
    const stats = await officerService.getCohortStats();
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCadetRoster,
  getCadetInspection,
  getCohortStats,
};
