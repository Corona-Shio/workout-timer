import type { TimerState, Phase } from './timer';

const $ = (id: string) => document.getElementById(id)!;

let startBtn: HTMLButtonElement;
let pauseBtn: HTMLButtonElement;
let resetBtn: HTMLButtonElement;
let skipBtn: HTMLButtonElement;
let timerDisplay: HTMLElement;
let phaseLabel: HTMLElement;
let setLabel: HTMLElement;
let container: HTMLElement;
let calendarBtn: HTMLButtonElement;
let timerContent: HTMLElement;

const OFFSET_KEY = 'timer-offset-y';

export function initUI() {
  startBtn = $('start-btn') as HTMLButtonElement;
  pauseBtn = $('pause-btn') as HTMLButtonElement;
  resetBtn = $('reset-btn') as HTMLButtonElement;
  skipBtn = $('skip-btn') as HTMLButtonElement;
  timerDisplay = $('timer-display');
  phaseLabel = $('phase-label');
  setLabel = $('set-label');
  calendarBtn = $('calendar-btn') as HTMLButtonElement;
  container = $('app');
  timerContent = $('timer-content');

  initDrag();
}

export function onStart(cb: () => void) {
  startBtn.addEventListener('click', cb);
}

export function onPause(cb: () => void) {
  pauseBtn.addEventListener('click', cb);
}

export function onReset(cb: () => void) {
  resetBtn.addEventListener('click', cb);
}

export function onSkip(cb: () => void) {
  skipBtn.addEventListener('click', cb);
}

export function onCalendar(cb: () => void) {
  calendarBtn.addEventListener('click', cb);
}

function formatTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function phaseText(phase: Phase, status: string): string {
  if (status === 'idle') return 'READY';
  if (status === 'finished') return 'COMPLETE!';
  switch (phase) {
    case 'warmup': return 'WARM UP';
    case 'exercise': return 'EXERCISE';
    case 'rest': return 'REST';
    case 'cooldown': return 'COOL DOWN';
  }
}

function bgClass(phase: Phase, status: string): string {
  if (status === 'idle' || status === 'finished') return 'bg-neutral';
  switch (phase) {
    case 'warmup': return 'bg-warmup';
    case 'exercise': return 'bg-exercise';
    case 'rest': return 'bg-rest';
    case 'cooldown': return 'bg-cooldown';
  }
}

function initDrag() {
  let offsetY = Number(localStorage.getItem(OFFSET_KEY) || 0);
  let startY = 0;
  let startOffset = 0;
  let dragging = false;
  let lastTap = 0;

  applyOffset(offsetY);

  timerContent.addEventListener('pointerdown', (e) => {
    if ((e.target as HTMLElement).closest('button')) return;
    dragging = true;
    startY = e.clientY;
    startOffset = offsetY;
    timerContent.classList.add('dragging');
    timerContent.setPointerCapture(e.pointerId);
  });

  timerContent.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const maxOffset = window.innerHeight * 0.4;
    offsetY = Math.max(-maxOffset, Math.min(maxOffset, startOffset + (e.clientY - startY)));
    applyOffset(offsetY);
  });

  timerContent.addEventListener('pointerup', (e) => {
    if (!dragging) return;
    dragging = false;
    timerContent.classList.remove('dragging');
    localStorage.setItem(OFFSET_KEY, String(offsetY));

    // Double-tap to reset
    const now = Date.now();
    if (now - lastTap < 300 && Math.abs(e.clientY - startY) < 5) {
      offsetY = 0;
      applyOffset(offsetY);
      localStorage.setItem(OFFSET_KEY, '0');
    }
    lastTap = now;
  });

  timerContent.addEventListener('pointercancel', () => {
    dragging = false;
    timerContent.classList.remove('dragging');
  });

  function applyOffset(y: number) {
    timerContent.style.transform = y === 0 ? '' : `translateY(${y}px)`;
  }
}

export function render(state: TimerState) {
  timerDisplay.textContent = formatTime(state.remainingMs);
  phaseLabel.textContent = phaseText(state.currentPhase, state.status);
  const isWorkout = state.currentPhase === 'exercise' || state.currentPhase === 'rest';
  setLabel.textContent = (state.status === 'idle' || state.status === 'finished' || !isWorkout)
    ? '' : `Set ${state.currentSet} / 4`;

  // Background
  container.className = bgClass(state.currentPhase, state.status);

  // Button visibility
  const isIdle = state.status === 'idle' || state.status === 'finished';
  const isRunning = state.status === 'running';
  const isPaused = state.status === 'paused';
  const isSkippable = (state.currentPhase === 'warmup' || state.currentPhase === 'cooldown')
    && (isRunning || isPaused);

  startBtn.style.display = (isIdle || isPaused) ? '' : 'none';
  startBtn.textContent = isPaused ? 'RESUME' : 'START';
  pauseBtn.style.display = isRunning ? '' : 'none';
  resetBtn.style.display = (isRunning || isPaused) ? '' : 'none';
  skipBtn.style.display = isSkippable ? '' : 'none';
  calendarBtn.style.display = isIdle ? '' : 'none';
}
