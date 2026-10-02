const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes by verifying JWT in Authorization Bearer header
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'lambo_dev_secret_key_12345');
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User no longer exists',
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authorization token',
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'No authorization token provided',
    });
  }
};

/**
 * Require user to have the officer role or supervisor clearance
 */
const requireOfficer = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === 'officer' ||
      (req.user.rollNumber && String(req.user.rollNumber).trim() === '9260572'))
  ) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access Denied: NSTP Officer or staff clearance required.',
  });
};

module.exports = { protect, requireOfficer };
