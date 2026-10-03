const mongoose = require('mongoose');
const Reminder = require('../models/Reminder');
const Tree = require('../models/Tree');
const User = require('../models/User');
const { sendPushToUser, sendNotification } = require('../utils/pushNotifier');

/**
 * Helper to advance recurring reminder date
 */
const calculateNextScheduledDate = (curDate, repeatInterval) => {
  let nextDate = new Date(curDate);

  if (repeatInterval === 'daily') {
    nextDate.setDate(curDate.getDate() + 1);
  } else if (repeatInterval === 'weekly') {
    nextDate.setDate(curDate.getDate() + 7);
  } else if (repeatInterval === 'biweekly') {
    nextDate.setDate(curDate.getDate() + 14);
  } else if (repeatInterval === 'monthly') {
    nextDate.setMonth(curDate.getMonth() + 1);
  }

  // If next date is still in the past, bump to today + offset
  if (nextDate.getTime() <= Date.now()) {
    nextDate = new Date();
    if (repeatInterval === 'daily') nextDate.setDate(nextDate.getDate() + 1);
    if (repeatInterval === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
    if (repeatInterval === 'biweekly') nextDate.setDate(nextDate.getDate() + 14);
    if (repeatInterval === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
  }

  return nextDate;
};

/**
 * Helper to resolve target Tree document and treeId
 */
const resolveTree = async (treeParam, treeIdParam) => {
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

  return { targetTree, targetTreeId };
};

/**
 * Fetch reminders for a user, optionally filtered by tree
 */
const getUserReminders = async (userId, treeParam) => {
  const query = { user: userId };

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

  return Reminder.find(query)
    .populate('tree', 'treeId species nickname healthStatus currentStage')
    .sort({ completed: 1, scheduledDate: 1 });
};

/**
 * Create a new care reminder
 */
const createReminder = async (userId, data) => {
  const {
    title,
    tree: treeParam,
    treeId: treeIdParam,
    type = 'watering',
    scheduledDate,
    repeatInterval = 'none',
  } = data;

  if (!title || !title.trim()) {
    const error = new Error('Reminder task title is required');
    error.statusCode = 400;
    throw error;
  }

  const { targetTree, targetTreeId } = await resolveTree(treeParam, treeIdParam);
  const dateVal = scheduledDate ? new Date(scheduledDate) : new Date();

  const reminder = await Reminder.create({
    user: userId,
    tree: targetTree ? targetTree._id : null,
    treeId: targetTreeId,
    title: title.trim(),
    type,
    scheduledDate: dateVal,
    repeatInterval,
    completed: false,
    isSent: false,
  });

  return Reminder.findById(reminder._id).populate(
    'tree',
    'treeId species nickname healthStatus currentStage'
  );
};

/**
 * Update an existing reminder (toggle completed or edit details)
 */
const updateReminder = async (userId, reminderId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(reminderId)) {
    const error = new Error('Invalid reminder ID format');
    error.statusCode = 400;
    throw error;
  }

  const reminder = await Reminder.findOne({ _id: reminderId, user: userId });
  if (!reminder) {
    const error = new Error('Reminder not found or access denied');
    error.statusCode = 404;
    throw error;
  }

  const { title, type, scheduledDate, repeatInterval, completed } = updateData;

  if (title !== undefined) reminder.title = title.trim();
  if (type !== undefined) reminder.type = type;
  if (repeatInterval !== undefined) reminder.repeatInterval = repeatInterval;

  if (completed !== undefined) {
    if (completed && reminder.repeatInterval && reminder.repeatInterval !== 'none') {
      reminder.scheduledDate = calculateNextScheduledDate(reminder.scheduledDate, reminder.repeatInterval);
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

  return Reminder.findById(reminder._id).populate(
    'tree',
    'treeId species nickname healthStatus currentStage'
  );
};

/**
 * Delete a user reminder
 */
const deleteReminder = async (userId, reminderId) => {
  if (!mongoose.Types.ObjectId.isValid(reminderId)) {
    const error = new Error('Invalid reminder ID format');
    error.statusCode = 400;
    throw error;
  }

  const reminder = await Reminder.findOneAndDelete({ _id: reminderId, user: userId });
  if (!reminder) {
    const error = new Error('Reminder not found or access denied');
    error.statusCode = 404;
    throw error;
  }

  return { id: reminderId };
};

/**
 * Register web push subscription
 */
const subscribePush = async (userId, subscription) => {
  if (!subscription || !subscription.endpoint || !subscription.keys) {
    const error = new Error('Valid push subscription object with endpoint and keys is required');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (!user.pushSubscriptions) {
    user.pushSubscriptions = [];
  }

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

  return { success: true };
};

/**
 * Dispatch test push notification
 */
const sendTestPush = async (userId, endpoint) => {
  const user = await User.findById(userId);

  if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
    const error = new Error('No push subscription found on this device. Please grant notification permissions first.');
    error.statusCode = 400;
    throw error;
  }

  let targetSub = null;
  if (endpoint) {
    targetSub = user.pushSubscriptions.find((sub) => sub.endpoint === endpoint);
  }

  if (!targetSub && user.pushSubscriptions.length > 0) {
    targetSub = user.pushSubscriptions[user.pushSubscriptions.length - 1];
  }

  if (!targetSub) {
    const error = new Error('Device subscription not found. Please enable notifications on this device.');
    error.statusCode = 404;
    throw error;
  }

  try {
    await sendNotification(targetSub, {
      title: 'LAMBO Telemetry Alert',
      body: 'Push notifications are operational on this device! You will receive care reminders for monitored specimens.',
      url: '/trees',
    });

    return { success: true, sentCount: 1 };
  } catch (pushErr) {
    if (pushErr.statusCode === 404 || pushErr.statusCode === 410) {
      user.pushSubscriptions = user.pushSubscriptions.filter(
        (s) => s.endpoint !== targetSub.endpoint
      );
      await user.save();
      const expiredErr = new Error('Device subscription has expired. Please toggle notification permissions to re-subscribe.');
      expiredErr.statusCode = 400;
      throw expiredErr;
    }
    throw pushErr;
  }
};

/**
 * Sweep and dispatch due reminders to users
 */
const checkDueReminders = async () => {
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

  return {
    checkedCount: dueReminders.length,
    dispatchedCount: sentTotal,
  };
};

module.exports = {
  getUserReminders,
  createReminder,
  updateReminder,
  deleteReminder,
  subscribePush,
  sendTestPush,
  checkDueReminders,
};
