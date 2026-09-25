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

const { uploadBufferToCloudinary } = require('../config/cloudinary');

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

/**
 * @desc    Update student profile and/or avatar
 * @route   PUT /api/auth/profile
 * @access  Private (JWT protected)
 */
const updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Student profile not found',
      });
    }

    const { name, course, section, currentPassword, newPassword } = req.body;

    if (name && name.trim()) {
      user.name = name.trim();
    }

    if (course !== undefined || section !== undefined) {
      user.course = (course || section || '').trim();
    }

    // Optional password change
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to change password',
        });
      }
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Incorrect current password',
        });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long',
        });
      }
      user.password = newPassword;
    }

    // Handle avatar file upload via Cloudinary (or fallback base64 in dev)
    if (req.file) {
      const uploadResult = await uploadBufferToCloudinary(req.file.buffer, 'lambo_avatars');
      user.avatar = uploadResult.url;
    } else if (req.body.avatar) {
      user.avatar = req.body.avatar;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
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

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
};

