const Reminder = require('../models/Reminder');
const { sendPushToUser } = require('./pushNotifier');

/**
 * Scan database for due reminders and dispatch Web Push notifications
 */
const runDueRemindersCheck = async () => {
  try {
    const now = new Date();
    const dueReminders = await Reminder.find({
      completed: false,
      isSent: false,
      scheduledDate: { $lte: now },
    }).populate('tree', 'treeId species nickname');

    if (!dueReminders || dueReminders.length === 0) {
      return { checkedCount: 0, dispatchedCount: 0 };
    }

    console.log(`[ReminderScheduler] Found ${dueReminders.length} due care reminder(s)`);

    let sentTotal = 0;

    for (const rem of dueReminders) {
      const treeLabel = rem.tree?.treeId || rem.treeId || 'Specimen';
      const treeName = rem.tree?.nickname || rem.tree?.species?.split(' (')[0] || '';

      const pushResult = await sendPushToUser(rem.user, {
        title: `🌿 Care Reminder: ${treeLabel}`,
        body: `${rem.title}${treeName ? ` (${treeName})` : ''} is due. Tap to log care or view specimen.`,
        url: rem.tree?.treeId ? `/trees/${rem.tree.treeId}` : '/trees',
        treeId: rem.tree?.treeId || rem.treeId,
      });

      if (pushResult.success) {
        sentTotal++;
      }

      // If recurring, advance scheduledDate to next cycle and reset isSent
      if (rem.repeatInterval && rem.repeatInterval !== 'none') {
        const curDate = new Date(rem.scheduledDate);
        let nextDate = new Date(curDate);

        if (rem.repeatInterval === 'daily') nextDate.setDate(curDate.getDate() + 1);
        else if (rem.repeatInterval === 'weekly') nextDate.setDate(curDate.getDate() + 7);
        else if (rem.repeatInterval === 'biweekly') nextDate.setDate(curDate.getDate() + 14);
        else if (rem.repeatInterval === 'monthly') nextDate.setMonth(curDate.getMonth() + 1);

        // Ensure next date is in future
        if (nextDate.getTime() <= Date.now()) {
          nextDate = new Date();
          if (rem.repeatInterval === 'daily') nextDate.setDate(nextDate.getDate() + 1);
          else if (rem.repeatInterval === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
          else if (rem.repeatInterval === 'biweekly') nextDate.setDate(nextDate.getDate() + 14);
          else if (rem.repeatInterval === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
        }

        rem.scheduledDate = nextDate;
        rem.isSent = false;
      } else {
        rem.isSent = true;
      }

      await rem.save();
    }

    console.log(`[ReminderScheduler] Dispatched ${sentTotal} push notifications`);
    return { checkedCount: dueReminders.length, dispatchedCount: sentTotal };
  } catch (error) {
    console.error('[ReminderScheduler] Error running due reminders check:', error);
    return { checkedCount: 0, dispatchedCount: 0, error: error.message };
  }
};

/**
 * Initialize periodic reminder scheduler background loop
 * Runs every 15 minutes (or intervalMs)
 */
const startReminderScheduler = (intervalMs = 15 * 60 * 1000) => {
  console.log(`[ReminderScheduler] Background scheduler initialized (interval: ${intervalMs / 1000}s)`);

  // Run initial check after server warms up (5 seconds)
  setTimeout(() => {
    runDueRemindersCheck();
  }, 5000);

  // Periodic recurring check
  const timer = setInterval(() => {
    runDueRemindersCheck();
  }, intervalMs);

  return timer;
};

module.exports = {
  runDueRemindersCheck,
  startReminderScheduler,
};
