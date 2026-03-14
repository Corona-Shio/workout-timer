let permissionGranted = false;

export async function requestPermission() {
  if (!('Notification' in window)) return;
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
    try {
      new Notification(title, { body, icon: '/workout-timer/icon-192.png' });
    } catch {
      // Notification constructor may fail on some platforms
    }
  }
}
