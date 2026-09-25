const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Generate signed JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'lambo_dev_secret_key_12345', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * @desc    Register a new student
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, rollNumber, password, course, section, avatar } = req.body;

    if (!name || !rollNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, student/roll number, and password',
      });
    }

    const normalizedRoll = rollNumber.trim().toUpperCase();

    // Check if user already exists
    const userExists = await User.findOne({ rollNumber: normalizedRoll });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: `Student with roll number ${normalizedRoll} is already registered`,
      });
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      rollNumber: normalizedRoll,
      password,
      course: (course || section || '').trim(),
      avatar: avatar || '',
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        rollNumber: user.rollNumber,
        course: user.course,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate student & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { rollNumber, password } = req.body;

    if (!rollNumber || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter student/roll number and password',
      });
    }

    const normalizedRoll = rollNumber.trim().toUpperCase();

    // Find student
    const user = await User.findOne({ rollNumber: normalizedRoll });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid student number or password',
      });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid student number or password',
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        rollNumber: user.rollNumber,
        course: user.course,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently authenticated student profile
 * @route   GET /api/auth/me
 * @access  Private (JWT protected)
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
};
