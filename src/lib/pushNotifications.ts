import { supabase } from "@/integrations/supabase/client";

// ✅ Use a mesma chave pública VAPID que você salvou nos Secrets e usa no subscribe
const VAPID_PUBLIC_KEY =
  "BLBz5Gh3qHVIUlG4HKV3MYy-tPxZHvXZkL3mS6z7n3f1XhQZGvQbJhELPbkKdHqNMPLJ3lPrO9oRtYz8xS6MqJU";

// ---------- Utils ----------
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

function isStandalonePWA(): boolean {
  // iOS Safari: window.navigator.standalone
  // PWA/Chrome: display-mode: standalone
  return (
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
    // @ts-expect-error iOS standalone
    Boolean(window.navigator.standalone)
  );
}

// ---------- Service Worker ----------
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!("serviceWorker" in navigator)) {
    console.log("Service Worker not supported");
    return null;
  }

  try {
    /**
     * ✅ Importante:
     * - Com VitePWA (generateSW ou injectManifest), o SW final fica em /sw.js
     * - NÃO existe mais /sw-push.js
     */
    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

    // Garante que está pronto
    await navigator.serviceWorker.ready;

    console.log("Service Worker registered/ready:", registration);
    return registration;
  } catch (error) {
    console.error("Service Worker registration failed:", error);
    return null;
  }
};

// ---------- Permissions ----------
export const requestPushPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.log("Notifications not supported");
    return false;
  }

  // Já concedida
  if (Notification.permission === "granted") return true;

  // Se negada, não adianta pedir de novo
  if (Notification.permission === "denied") {
    console.log("Push permission denied (browser level). User must enable in settings.");
    return false;
  }

  const permission = await Notification.requestPermission();
  console.log("Push permission:", permission);
  return permission === "granted";
};

// ---------- Subscribe / Unsubscribe ----------
export const subscribeToPush = async (userId: string): Promise<boolean> => {
  try {
    // Opcional: você pediu “só no app instalado”
    if (!isStandalonePWA()) {
      console.log("Not running as installed PWA (standalone). Skipping push subscribe.");
      return false;
    }

    // 1) Permissão
    const hasPermission = await requestPushPermission();
    if (!hasPermission) return false;

    // 2) SW
    const registration = await registerServiceWorker();
    if (!registration) return false;

    // 3) Subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      console.log("Creating new push subscription...");
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      console.log("Push subscription created:", subscription);
    } else {
      console.log("Existing subscription found:", subscription);
    }

    // 4) Salvar subscription no backend (Edge Function)
    const json = subscription.toJSON();

    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
      console.error("Subscription JSON missing endpoint/keys:", json);
      return false;
    }

    const { data, error } = await supabase.functions.invoke("send-push", {
      body: {
        action: "subscribe",
        userId,
        subscriptionData: {
          endpoint: json.endpoint,
          keys: {
            p256dh: json.keys.p256dh,
            auth: json.keys.auth,
          },
        },
      },
    });

    if (error) {
      console.error("Error saving subscription:", error);
      return false;
    }

    console.log("Push subscription saved successfully:", data);
    return true;
  } catch (error) {
    console.error("Error subscribing to push:", error);
    return false;
  }
};

export const unsubscribeFromPush = async (userId: string): Promise<boolean> => {
  try {
    if (!("serviceWorker" in navigator)) return false;

    const registration = await navigator.serviceWorker.ready;
    const sub = await registration.pushManager.getSubscription();

    if (sub) {
      // Remove do navegador
      await sub.unsubscribe();
    }

    // Remove do seu backend (melhor mandar endpoint; aqui mandamos userId apenas se sua função aceitar)
    // Se sua Edge Function exige endpoint, adapte para enviar sub?.endpoint antes de unsubscribe.
    const { error } = await supabase.functions.invoke("send-push", {
      body: {
        action: "unsubscribe",
        userId,
        subscriptionData: {
          endpoint: sub?.endpoint,
        },
      },
    });

    if (error) {
      console.error("Error unsubscribing on server:", error);
      // ainda assim já desinscreveu localmente
    }

    return true;
  } catch (e) {
    console.error("unsubscribeFromPush failed:", e);
    return false;
  }
};

// ---------- Send push (server triggers) ----------
export const sendPushNotification = async (
  targetUserId: string,
  title: string,
  message: string,
  type: "payment_marked" | "payment_confirmed" | "reminder"
): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke("send-push", {
      body: {
        action: "send",
        userId: targetUserId,
        title,
        message,
        type,
      },
    });

    if (error) {
      console.error("Error sending push:", error);
      return false;
    }

    console.log("Push request sent:", data);
    return true;
  } catch (error) {
    console.error("Error sending push notification:", error);
    return false;
  }
};

// ---------- Foreground local notification ----------
export const showLocalNotification = (title: string, body: string): void => {
  if ("Notification" in window && Notification.permission === "granted") {
    const n = new Notification(title, {
      body,
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
      tag: "local-notification",
      requireInteraction: true,
    });

    n.onclick = () => {
      window.focus();
      n.close();
    };
  }
};
