// Tracks in-flight API requests so the UI can tell the user when the backend
// is slow to answer — typically a free-tier host waking up from sleep, which
// can take ~30–60 s. "Slow" = some request has been pending for SLOW_AFTER_MS.

export const SLOW_AFTER_MS = 3000;

let pending = 0;
let slow = false;
let startedAt: number | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function setSlow(next: boolean) {
  if (slow === next) return;
  slow = next;
  emit();
}

// Call before a request starts; call the returned function when it settles.
export function trackRequest(): () => void {
  pending += 1;
  if (pending === 1) {
    startedAt = Date.now();
    timer = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
  }
  let finished = false;
  return () => {
    if (finished) return;
    finished = true;
    pending = Math.max(0, pending - 1);
    if (pending === 0) {
      if (timer) clearTimeout(timer);
      timer = null;
      startedAt = null;
      setSlow(false);
    }
  };
}

export function subscribeSlow(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const getSlowSnapshot = () => slow;
export const getServerSlowSnapshot = () => false;
export const getSlowSince = () => startedAt;
