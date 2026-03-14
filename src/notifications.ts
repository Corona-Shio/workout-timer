let permissionGranted = false;
let swRegistration: ServiceWorkerRegistration | null = null;

export async function requestPermission() {
  if (!('Notification' in window)) return;

  // Register Service Worker for iOS notification support
  if ('serviceWorker' in navigator && !swRegistration) {
    try {
      swRegistration = await navigator.serviceWorker.register('/workout-timer/sw.js');
    } catch {
      // SW registration failed
    }
  }

  if (Notification.permission === 'granted') {
    permissionGranted = true;
    return;
  }
  if (Notification.permission === 'denied') return;
  const result = await Notification.requestPermission();
  permissionGranted = result === 'granted';
}

export function notify(title: string, body: string) {
  // Vibration
  if ('vibrate' in navigator) {
    navigator.vibrate([200, 100, 200]);
  }

  // Web Notification (works best when page is in background)
  if (permissionGranted && document.visibilityState === 'hidden') {
    // Use Service Worker notification (required for iOS)
    if (swRegistration) {
      swRegistration.showNotification(title, {
        body,
        icon: '/workout-timer/icon-192.png',
        tag: 'hiit-timer',
      });
      return;
    }

    // Fallback for browsers without SW support
    try {
      new Notification(title, { body, icon: '/workout-timer/icon-192.png' });
    } catch {
      // Notification constructor may fail on some platforms
    }
  }
}
