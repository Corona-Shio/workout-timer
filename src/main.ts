import { Timer } from './timer';
import { initUI, onStart, onPause, onReset, onSkip, render } from './ui';
import { resumeAudioContext, startSilenceLoop, stopSilenceLoop, playBeep, playPhaseChange, playFinish } from './audio';
import { acquireWakeLock, releaseWakeLock } from './wake-lock';
import { requestPermission, notify } from './notifications';
import './styles.css';

const timer = new Timer();
let worker: Worker | null = null;
let lastBeepSecond = -1;

timer.setOnPhaseChange((event) => {
  if (event.finished) {
    playFinish();
    notify('Workout Complete!', 'Great job! All 4 sets done.');
    stopTimer();
  } else {
    playPhaseChange();
    const labels: Record<string, string> = {
      warmup: 'Warm Up',
      exercise: 'Exercise',
      rest: 'Rest',
      cooldown: 'Cool Down',
    };
    const label = labels[event.newPhase];
    const isWorkout = event.newPhase === 'exercise' || event.newPhase === 'rest';
    const title = isWorkout ? `${label} — Set ${event.newSet}` : label;
    const body = event.newPhase === 'exercise' ? 'Go hard!'
      : event.newPhase === 'rest' ? 'Take it easy'
      : event.newPhase === 'warmup' ? 'Get ready!'
      : 'Wind down';
    notify(title, body);
  }
});

function tick() {
  const state = timer.tick();
  render(state);

  // Countdown beeps for last 3 seconds
  if (state.status === 'running') {
    const secondsLeft = Math.ceil(state.remainingMs / 1000);
    if (secondsLeft <= 3 && secondsLeft > 0 && secondsLeft !== lastBeepSecond) {
      lastBeepSecond = secondsLeft;
      playBeep();
    }
    if (secondsLeft > 3) {
      lastBeepSecond = -1;
    }
  }
}

function startTimer() {
  resumeAudioContext();
  timer.start();
  startSilenceLoop();
  acquireWakeLock();
  lastBeepSecond = -1;

  if (!worker) {
    worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = () => tick();
  }
  worker.postMessage('start');
  tick();
}

function pauseTimer() {
  timer.pause();
  worker?.postMessage('stop');
  stopSilenceLoop();
  releaseWakeLock();
  tick();
}

function stopTimer() {
  worker?.postMessage('stop');
  stopSilenceLoop();
  releaseWakeLock();
  tick();
}

function resetTimer() {
  timer.reset();
  worker?.postMessage('stop');
  stopSilenceLoop();
  releaseWakeLock();
  lastBeepSecond = -1;
  tick();
}

// Recover from background on visibility change
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    tick();
  }
});

// Init
initUI();
onStart(() => {
  requestPermission();
  startTimer();
});
onPause(pauseTimer);
onReset(resetTimer);
onSkip(() => {
  timer.skip();
  tick();
});
tick();
