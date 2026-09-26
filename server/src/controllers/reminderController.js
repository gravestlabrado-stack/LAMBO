const mongoose = require('mongoose');
const Reminder = require('../models/Reminder');
const Tree = require('../models/Tree');
const User = require('../models/User');
const { sendPushToUser } = require('../utils/pushNotifier');

/**
 * @desc    Get user's reminders
 * @route   GET /api/reminders
 * @access  Private
 */
const getReminders = async (req, res, next) => {
  try {
    const { tree: treeParam } = req.query;
    const query = { user: req.user._id };

    if (treeParam) {
      let treeDoc;
      if (mongoose.Types.ObjectId.isValid(treeParam)) {
        treeDoc = await Tree.findById(treeParam);
      } else {
        treeDoc = await Tree.findOne({ treeId: String(treeParam).toUpperCase() });
      }
      if (treeDoc) {
        query.tree = treeDoc._id;
      }
    }

    const reminders = await Reminder.find(query)
      .populate('tree', 'treeId species nickname healthStatus currentStage')
      .sort({ completed: 1, scheduledDate: 1 });

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
    const {
      title,
      tree: treeParam,
      treeId: treeIdParam,
      type = 'watering',
      scheduledDate,
      repeatInterval = 'none',
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Reminder task title is required',
      });
    }

    let targetTree = null;
    let targetTreeId = treeIdParam ? String(treeIdParam).toUpperCase().trim() : '';

    if (treeParam) {
      if (mongoose.Types.ObjectId.isValid(treeParam)) {
        targetTree = await Tree.findById(treeParam);
      } else {
        targetTree = await Tree.findOne({ treeId: String(treeParam).toUpperCase() });
      }
      if (targetTree) {
        targetTreeId = targetTree.treeId;
      }
    } else if (targetTreeId) {
      targetTree = await Tree.findOne({ treeId: targetTreeId });
    }

    const dateVal = scheduledDate ? new Date(scheduledDate) : new Date();

    const reminder = await Reminder.create({
      user: req.user._id,
      tree: targetTree ? targetTree._id : null,
      treeId: targetTreeId,
      title: title.trim(),
      type,
      scheduledDate: dateVal,
      repeatInterval,
      completed: false,
      isSent: false,
    });

    const populated = await Reminder.findById(reminder._id).populate(
      'tree',
      'treeId species nickname healthStatus currentStage'
    );

    res.status(201).json({
      success: true,
      message: 'Reminder scheduled successfully',
      data: populated,
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
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reminder ID format',
      });
    }

    const reminder = await Reminder.findOne({ _id: id, user: req.user._id });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found or access denied',
      });
    }

    const { title, type, scheduledDate, repeatInterval, completed } = req.body;

    if (title !== undefined) reminder.title = title.trim();
    if (type !== undefined) reminder.type = type;
    if (repeatInterval !== undefined) reminder.repeatInterval = repeatInterval;

    if (completed !== undefined) {
      if (completed && reminder.repeatInterval && reminder.repeatInterval !== 'none') {
        // Recurring reminder: advance scheduledDate to next cycle
        const curDate = new Date(reminder.scheduledDate);
        let nextDate = new Date(curDate);

        if (reminder.repeatInterval === 'daily') {
          nextDate.setDate(curDate.getDate() + 1);
        } else if (reminder.repeatInterval === 'weekly') {
          nextDate.setDate(curDate.getDate() + 7);
        } else if (reminder.repeatInterval === 'biweekly') {
          nextDate.setDate(curDate.getDate() + 14);
        } else if (reminder.repeatInterval === 'monthly') {
          nextDate.setMonth(curDate.getMonth() + 1);
        }

        // If next date is still in the past, bump to today + offset
        if (nextDate.getTime() <= Date.now()) {
          nextDate = new Date();
          if (reminder.repeatInterval === 'daily') nextDate.setDate(nextDate.getDate() + 1);
          if (reminder.repeatInterval === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
          if (reminder.repeatInterval === 'biweekly') nextDate.setDate(nextDate.getDate() + 14);
          if (reminder.repeatInterval === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
        }

        reminder.scheduledDate = nextDate;
        reminder.completed = false;
        reminder.isSent = false;
      } else {
        reminder.completed = Boolean(completed);
      }
    }

    if (scheduledDate) {
      reminder.scheduledDate = new Date(scheduledDate);
      reminder.isSent = false;
    }

    await reminder.save();

    const populated = await Reminder.findById(reminder._id).populate(
      'tree',
      'treeId species nickname healthStatus currentStage'
    );

    res.status(200).json({
      success: true,
      message: 'Reminder updated',
      data: populated,
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
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid reminder ID format',
      });
    }

    const reminder = await Reminder.findOneAndDelete({ _id: id, user: req.user._id });

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found or access denied',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Reminder removed',
      data: { id },
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
    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({
        success: false,
        message: 'Valid push subscription object with endpoint and keys is required',
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.pushSubscriptions) {
      user.pushSubscriptions = [];
    }

    // Avoid duplicate subscriptions
    const exists = user.pushSubscriptions.some((s) => s.endpoint === subscription.endpoint);
    if (!exists) {
      user.pushSubscriptions.push({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      });
      await user.save();
    }

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
    const user = await User.findById(req.user._id);

    if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No push subscription found on this device. Please grant notification permissions first.',
      });
    }

    const result = await sendPushToUser(user, {
      title: 'LAMBO Telemetry Alert',
      body: 'Push notifications are operational! You will receive care reminders for monitored specimens.',
      url: '/trees',
    });

    res.status(200).json({
      success: true,
      message: 'Test notification dispatched',
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
    const now = new Date();
    const dueReminders = await Reminder.find({
      completed: false,
      isSent: false,
      scheduledDate: { $lte: now },
    }).populate('tree', 'treeId species nickname');

    let sentTotal = 0;

    for (const rem of dueReminders) {
      const treeLabel = rem.tree?.treeId || rem.treeId || 'Specimen';
      await sendPushToUser(rem.user, {
        title: `Care Alert: ${treeLabel}`,
        body: `${rem.title} (${rem.type.toUpperCase()}) is due today for ${treeLabel}.`,
        url: rem.tree?.treeId ? `/trees/${rem.tree.treeId}` : '/trees',
        treeId: rem.tree?.treeId || rem.treeId,
      });

      rem.isSent = true;
      await rem.save();
      sentTotal++;
    }

    res.status(200).json({
      success: true,
      checkedCount: dueReminders.length,
      dispatchedCount: sentTotal,
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
