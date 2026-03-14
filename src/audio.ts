let ctx: AudioContext | null = null;
let silenceInterval: ReturnType<typeof setInterval> | null = null;

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
  }
  return ctx;
}

function playTone(frequency: number, duration: number, volume = 0.3) {
  const c = getCtx();
  if (c.state === 'suspended') c.resume();

  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'sine';
  osc.frequency.value = frequency;
  gain.gain.value = volume;
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(c.currentTime);
  osc.stop(c.currentTime + duration);
}

/** Short beep for countdown (last 3 seconds) */
export function playBeep() {
  playTone(880, 0.15, 0.25);
}

/** Longer chime for phase transition */
export function playPhaseChange() {
  playTone(660, 0.3, 0.35);
  setTimeout(() => playTone(880, 0.4, 0.35), 200);
}

/** Completion fanfare */
export function playFinish() {
  playTone(523, 0.2, 0.3);
  setTimeout(() => playTone(659, 0.2, 0.3), 200);
  setTimeout(() => playTone(784, 0.2, 0.3), 400);
  setTimeout(() => playTone(1047, 0.5, 0.35), 600);
}

/** Resume AudioContext on user interaction (autoplay policy) */
export function resumeAudioContext() {
  const c = getCtx();
  if (c.state === 'suspended') c.resume();
}

/**
 * Start silent audio loop to prevent iOS from suspending the page.
 * Uses Web Audio API oscillator at near-zero volume to avoid
 * interfering with other audio apps.
 */
export function startSilenceLoop() {
  stopSilenceLoop();
  const c = getCtx();
  if (c.state === 'suspended') c.resume();

  // Play a near-silent tick every 5 seconds to keep audio context alive
  silenceInterval = setInterval(() => {
    if (c.state === 'suspended') c.resume();
    const osc = c.createOscillator();
    const gain = c.createGain();
    gain.gain.value = 0.001; // Nearly silent
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + 0.05);
  }, 5000);
}

export function stopSilenceLoop() {
  if (silenceInterval) {
    clearInterval(silenceInterval);
    silenceInterval = null;
  }
}
