import { supabase } from '@/integrations/supabase/client';

// VAPID Public Key - generate your own for production
const VAPID_PUBLIC_KEY = 'BLBz5Gh3qHVIUlG4HKV3MYy-tPxZHvXZkL3mS6z7n3f1XhQZGvQbJhELPbkKdHqNMPLJ3lPrO9oRtYz8xS6MqJU';

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer;
}

export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw-push.js', {
      scope: '/'
    });
    console.log('Service Worker registered:', registration);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
};

export const requestPushPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return false;
  }

  const permission = await Notification.requestPermission();
  console.log('Push permission:', permission);
  return permission === 'granted';
};

export const subscribeToPush = async (userId: string): Promise<boolean> => {
  try {
    // First request permission
    const hasPermission = await requestPushPermission();
    if (!hasPermission) {
      console.log('Push permission denied');
      return false;
    }

    // Register service worker
    const registration = await registerServiceWorker();
    if (!registration) {
      console.log('Service worker registration failed');
      return false;
    }

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;
    console.log('Service worker ready');

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Create new subscription
      console.log('Creating new push subscription...');
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
        console.log('Push subscription created:', subscription);
      } catch (subError) {
        console.error('Error creating push subscription:', subError);
        // Continue without push - use realtime instead
        console.log('Push subscription setup complete (realtime only) for user:', userId);
        return true;
      }
    } else {
      console.log('Existing subscription found:', subscription);
    }

    // Send subscription to server
    const subscriptionJson = subscription.toJSON();
    console.log('Sending subscription to server for user:', userId);
    
    const { data, error } = await supabase.functions.invoke('send-push', {
      body: {
        action: 'subscribe',
        userId,
        subscriptionData: {
          endpoint: subscriptionJson.endpoint,
          keys: {
            p256dh: subscriptionJson.keys?.p256dh,
            auth: subscriptionJson.keys?.auth
          }
        }
      }
    });

    if (error) {
      console.error('Error saving subscription:', error);
      return false;
    }

    console.log('Push subscription saved successfully:', data);
    return true;
  } catch (error) {
    console.error('Error subscribing to push:', error);
    return false;
  }
};

export const sendPushNotification = async (
  targetUserId: string,
  title: string,
  message: string,
  type: 'payment_marked' | 'payment_confirmed' | 'reminder'
): Promise<boolean> => {
  try {
    console.log('Sending push notification to:', targetUserId, { title, message, type });
    
    const { data, error } = await supabase.functions.invoke('send-push', {
      body: {
        action: 'send',
        userId: targetUserId,
        title,
        message,
        type
      }
    });

    if (error) {
      console.error('Error sending push:', error);
      return false;
    }

    console.log('Push notification sent:', data);
    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
};

// Also show local notification if app is in foreground
export const showLocalNotification = (title: string, body: string): void => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/pwa-192x192.png',
      tag: 'local-notification'
    });
  }
};