const reminderService = require('../services/reminderService');

/**
 * @desc    Get user's reminders
 * @route   GET /api/reminders
 * @access  Private
 */
const getReminders = async (req, res, next) => {
  try {
    const reminders = await reminderService.getUserReminders(req.user._id, req.query.tree);
    res.status(200).json({
      success: true,
      count: reminders.length,
      data: reminders,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a care reminder
 * @route   POST /api/reminders
 * @access  Private
 */
const createReminder = async (req, res, next) => {
  try {
    const reminder = await reminderService.createReminder(req.user._id, req.body);
    res.status(201).json({
      success: true,
      message: 'Reminder scheduled successfully',
      data: reminder,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update a reminder (toggle completed or edit details)
 * @route   PUT /api/reminders/:id
 * @access  Private
 */
const updateReminder = async (req, res, next) => {
  try {
    const reminder = await reminderService.updateReminder(req.user._id, req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Reminder updated',
      data: reminder,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a reminder
 * @route   DELETE /api/reminders/:id
 * @access  Private
 */
const deleteReminder = async (req, res, next) => {
  try {
    const data = await reminderService.deleteReminder(req.user._id, req.params.id);
    res.status(200).json({
      success: true,
      message: 'Reminder removed',
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Register a browser Web Push subscription for the logged-in user
 * @route   POST /api/reminders/subscribe
 * @access  Private
 */
const subscribePush = async (req, res, next) => {
  try {
    await reminderService.subscribePush(req.user._id, req.body.subscription);
    res.status(200).json({
      success: true,
      message: 'Web push notifications registered successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send a test push notification to the logged-in user's device
 * @route   POST /api/reminders/test-push
 * @access  Private
 */
const sendTestPush = async (req, res, next) => {
  try {
    const result = await reminderService.sendTestPush(req.user._id, req.body.endpoint);
    res.status(200).json({
      success: true,
      message: 'Test notification dispatched to this device',
      result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Check and trigger due reminders for all users
 * @route   POST /api/reminders/trigger-check
 * @access  Private
 */
const checkDueReminders = async (req, res, next) => {
  try {
    const counts = await reminderService.checkDueReminders();
    res.status(200).json({
      success: true,
      ...counts,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  subscribePush,
  sendTestPush,
  checkDueReminders,
};
