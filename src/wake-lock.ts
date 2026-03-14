let sentinel: WakeLockSentinel | null = null;

async function requestLock() {
  try {
    if ('wakeLock' in navigator) {
      sentinel = await navigator.wakeLock.request('screen');
      sentinel.addEventListener('release', () => {
        sentinel = null;
      });
    }
  } catch {
    // Wake Lock request failed (e.g., low battery)
  }
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible' && !sentinel) {
    requestLock();
  }
}

export async function acquireWakeLock() {
  await requestLock();
  document.addEventListener('visibilitychange', handleVisibilityChange);
}

export async function releaseWakeLock() {
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  if (sentinel) {
    await sentinel.release();
    sentinel = null;
  }
}
