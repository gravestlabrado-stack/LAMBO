const Zone = require('../models/Zone');

/**
 * @desc    Get all forest zones / campus sectors
 * @route   GET /api/zones
 * @access  Private
 */
const getZones = async (req, res, next) => {
  try {
    const zones = await Zone.find().sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: zones.length,
      data: zones,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add a new forest zone / campus sector
 * @route   POST /api/zones
 * @access  Private
 */
const createZone = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a zone / campus sector name',
      });
    }

    const trimmedName = name.trim();

    // Case-insensitive check
    const existing = await Zone.findOne({
      name: { $regex: new RegExp(`^${trimmedName}$`, 'i') },
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: 'Zone already exists',
        data: existing,
      });
    }

    const zone = await Zone.create({
      name: trimmedName,
      description: (description || '').trim(),
      addedBy: req.user?._id,
    });

    res.status(201).json({
      success: true,
      message: 'New campus sector added successfully',
      data: zone,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getZones,
  createZone,
};
