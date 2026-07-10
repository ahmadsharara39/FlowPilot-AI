// Tracks in-flight API requests and flips a "slow" flag when one is taking a
// while — used to reassure users during Render free-tier cold starts (~50s) and
// long free-AI workflow runs (~15s) instead of leaving them staring at a spinner.

type Listener = (slow: boolean) => void;

const listeners = new Set<Listener>();
let pending = 0;
let slow = false;
let timer: ReturnType<typeof setTimeout> | undefined;

const THRESHOLD_MS = 3500;

function emit() {
  for (const l of listeners) l(slow);
}

export function subscribeSlow(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function isSlow(): boolean {
  return slow;
}

export function requestStarted(): void {
  pending += 1;
  if (pending === 1 && !timer) {
    timer = setTimeout(() => {
      slow = true;
      emit();
    }, THRESHOLD_MS);
  }
}

export function requestEnded(): void {
  pending = Math.max(0, pending - 1);
  if (pending === 0) {
    if (timer) {
      clearTimeout(timer);
      timer = undefined;
    }
    if (slow) {
      slow = false;
      emit();
    }
  }
}
