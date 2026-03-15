export type Phase = 'warmup' | 'exercise' | 'rest' | 'cooldown';
export type Status = 'idle' | 'running' | 'paused' | 'finished';

export interface TimerState {
  status: Status;
  currentSet: number;
  currentPhase: Phase;
  remainingMs: number;
}

export interface PhaseChangeEvent {
  previousPhase: Phase;
  previousSet: number;
  newPhase: Phase;
  newSet: number;
  finished: boolean;
}

const WARMUP_DURATION = 5 * 60 * 1000;
const EXERCISE_DURATION = 4 * 60 * 1000;
const REST_DURATION = 3 * 60 * 1000;
const COOLDOWN_DURATION = 5 * 60 * 1000;
const TOTAL_SETS = 4;

function phaseDuration(phase: Phase): number {
  switch (phase) {
    case 'warmup': return WARMUP_DURATION;
    case 'exercise': return EXERCISE_DURATION;
    case 'rest': return REST_DURATION;
    case 'cooldown': return COOLDOWN_DURATION;
  }
}

export class Timer {
  private status: Status = 'idle';
  private currentSet = 1;
  private currentPhase: Phase = 'warmup';
  private phaseStartedAt = 0;
  private pausedRemaining = 0;
  private onPhaseChange: ((event: PhaseChangeEvent) => void) | null = null;

  setOnPhaseChange(cb: (event: PhaseChangeEvent) => void) {
    this.onPhaseChange = cb;
  }

  start() {
    if (this.status === 'idle' || this.status === 'finished') {
      this.currentSet = 1;
      this.currentPhase = 'warmup';
      this.phaseStartedAt = Date.now();
      this.status = 'running';
    } else if (this.status === 'paused') {
      this.phaseStartedAt = Date.now() - (phaseDuration(this.currentPhase) - this.pausedRemaining);
      this.status = 'running';
    }
  }

  pause() {
    if (this.status !== 'running') return;
    this.pausedRemaining = this.getRemainingMs();
    this.status = 'paused';
  }

  reset() {
    this.status = 'idle';
    this.currentSet = 1;
    this.currentPhase = 'warmup';
    this.phaseStartedAt = 0;
    this.pausedRemaining = 0;
  }

  skip() {
    if (this.status !== 'running' && this.status !== 'paused') return;
    if (this.currentPhase !== 'warmup' && this.currentPhase !== 'cooldown') return;

    const prevPhase = this.currentPhase;
    const prevSet = this.currentSet;

    if (this.currentPhase === 'warmup') {
      this.currentPhase = 'exercise';
      this.phaseStartedAt = Date.now();
      this.pausedRemaining = phaseDuration(this.currentPhase);
      this.onPhaseChange?.({
        previousPhase: prevPhase,
        previousSet: prevSet,
        newPhase: this.currentPhase,
        newSet: this.currentSet,
        finished: false,
      });
    } else {
      // cooldown skip -> finish
      this.status = 'finished';
      this.onPhaseChange?.({
        previousPhase: prevPhase,
        previousSet: prevSet,
        newPhase: 'cooldown',
        newSet: this.currentSet,
        finished: true,
      });
    }
  }

  tick(): TimerState {
    if (this.status === 'running') {
      this.advanceIfNeeded();
    }
    return {
      status: this.status,
      currentSet: this.currentSet,
      currentPhase: this.currentPhase,
      remainingMs: this.status === 'paused' ? this.pausedRemaining :
                   this.status === 'running' ? this.getRemainingMs() :
                   this.status === 'idle' ? WARMUP_DURATION : 0,
    };
  }

  private getRemainingMs(): number {
    const elapsed = Date.now() - this.phaseStartedAt;
    return Math.max(0, phaseDuration(this.currentPhase) - elapsed);
  }

  private advanceIfNeeded() {
    while (this.status === 'running' && this.getRemainingMs() <= 0) {
      const prevPhase = this.currentPhase;
      const prevSet = this.currentSet;

      if (this.currentPhase === 'warmup') {
        // Warmup done, move to first exercise
        this.currentPhase = 'exercise';
        this.phaseStartedAt += phaseDuration(prevPhase);
      } else if (this.currentPhase === 'exercise') {
        if (this.currentSet >= TOTAL_SETS) {
          // Last set exercise done — move to cooldown
          this.currentPhase = 'cooldown';
          this.phaseStartedAt += phaseDuration(prevPhase);
        } else {
          // Move to rest
          this.currentPhase = 'rest';
          this.phaseStartedAt += phaseDuration(prevPhase);
        }
      } else if (this.currentPhase === 'rest') {
        // Rest done, move to next set's exercise
        this.currentPhase = 'exercise';
        this.currentSet++;
        this.phaseStartedAt += phaseDuration(prevPhase);
      } else {
        // Cooldown done — finished
        this.status = 'finished';
        this.onPhaseChange?.({
          previousPhase: prevPhase,
          previousSet: prevSet,
          newPhase: 'cooldown',
          newSet: this.currentSet,
          finished: true,
        });
        return;
      }

      this.onPhaseChange?.({
        previousPhase: prevPhase,
        previousSet: prevSet,
        newPhase: this.currentPhase,
        newSet: this.currentSet,
        finished: false,
      });
    }
  }
}
