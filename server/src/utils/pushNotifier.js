const webpush = require('web-push');
const User = require('../models/User');

// Configure VAPID credentials if set
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:dev@lambo.local',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  console.log('[WebPush] VAPID keys successfully initialized');
} else {
  console.warn('[WebPush] VAPID keys not configured in environment');
}

/**
 * Send push notification to a single browser subscription
 * @param {Object} subscription - Web push subscription object { endpoint, keys: { p256dh, auth } }
 * @param {Object} payload - Notification payload { title, body, icon, url, treeId }
 */
const sendNotification = async (subscription, payload) => {
  if (!subscription || !subscription.endpoint) {
    throw new Error('Invalid push subscription: missing endpoint');
  }

  const payloadString = JSON.stringify({
    title: payload.title || 'LAMBO Specimen Alert',
    body: payload.body || 'You have a pending botanical care reminder.',
    icon: payload.icon || '/lambo-logo.svg',
    badge: payload.badge || '/lambo-logo.svg',
    url: payload.url || '/',
    treeId: payload.treeId || null,
    timestamp: Date.now(),
  });

  return await webpush.sendNotification(subscription, payloadString);
};

/**
 * Send push notification to all active devices of a user
 * Automatically purges expired/invalidated subscriptions (HTTP 404/410)
 * @param {String|Object} userId - User document or ObjectId
 * @param {Object} payload - Notification payload
 */
const sendPushToUser = async (userId, payload) => {
  try {
    const user = typeof userId === 'object' && userId.pushSubscriptions
      ? userId
      : await User.findById(userId);

    if (!user || !user.pushSubscriptions || user.pushSubscriptions.length === 0) {
      return { success: false, sentCount: 0, reason: 'No registered push subscriptions' };
    }

    const invalidEndpoints = [];
    let sentCount = 0;

    await Promise.all(
      user.pushSubscriptions.map(async (sub) => {
        try {
          await sendNotification(sub, payload);
          sentCount++;
        } catch (err) {
          // If subscription has expired or unsubscribed, mark for removal
          if (err.statusCode === 404 || err.statusCode === 410) {
            invalidEndpoints.push(sub.endpoint);
          } else {
            console.error('[WebPush] Failed sending push to endpoint:', err.message);
          }
        }
      })
    );

    // Prune stale/expired subscriptions if any
    if (invalidEndpoints.length > 0) {
      user.pushSubscriptions = user.pushSubscriptions.filter(
        (s) => !invalidEndpoints.includes(s.endpoint)
      );
      await user.save();
    }

    return { success: sentCount > 0, sentCount, prunedCount: invalidEndpoints.length };
  } catch (error) {
    console.error('[WebPush] Error sending push to user:', error);
    return { success: false, sentCount: 0, error: error.message };
  }
};

module.exports = {
  sendNotification,
  sendPushToUser,
};
