import reminderService from '../services/reminderService';

/**
 * Convert standard base64 URL string to Uint8Array required by pushManager.subscribe
 */
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if the current browser environment supports Push Notifications and Service Workers
 */
export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Current notification permission state ('default', 'granted', 'denied')
 */
export function getNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

/**
 * Request notification permission and subscribe to Web Push
 */
export async function subscribeUserToPush() {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported in this browser.');
  }

  // 1. Request permission if not already granted
  let permission = Notification.permission;
  if (permission === 'default') {
    permission = await Notification.requestPermission();
  }

  if (permission !== 'granted') {
    throw new Error('Notification permission was denied by the user.');
  }

  // 2. Get VAPID public key
  const vapidKey =
    import.meta.env.VITE_VAPID_PUBLIC_KEY ||
    'BFGKJuZzR1BzhWQkZZQz3EZIWLOYR8LZjhgHXk5VP0HdgckB_dndhQypDRciCPbcOEA6Me36b-m6Z-I-5v6tbV8';

  // 3. Ensure service worker is ready
  const registration = await navigator.serviceWorker.ready;

  // 4. Check for existing subscription or create new one
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    const convertedVapidKey = urlBase64ToUint8Array(vapidKey);
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey,
    });
  }

  // 5. Send subscription to backend
  if (subscription) {
    await reminderService.subscribePush(subscription);
  }

  return subscription;
}

/**
 * Send a test push notification to this device
 */
export async function sendTestAlert() {
  return await reminderService.sendTestPush();
}
