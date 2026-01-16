import { supabase } from '@/integrations/supabase/client';

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
      return false;
    }

    // Wait for service worker to be ready
    await navigator.serviceWorker.ready;

    console.log('Push subscription setup complete for user:', userId);
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
