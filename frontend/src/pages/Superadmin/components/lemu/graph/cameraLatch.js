/* Fit latch for the graph camera.

   onEngineStop fires on EVERY simulation cooldown, not just the first. The
   original handler called zoomToFit() unconditionally, so any interaction that
   reheated the simulation ended by yanking the camera back out — and it raced
   the 900ms cameraPosition() focus animation from a node click. This latch is
   the whole fix: fit once per layout generation, never while focusing. */
export const createFitLatch = () => {
  let fitted = false;
  let focusing = false;

  return {
    /** True at most once per generation, and never mid-focus. */
    shouldFit() {
      if (focusing || fitted) return false;
      fitted = true;
      return true;
    },
    beginFocus() { focusing = true; },
    endFocus() { focusing = false; },
    /** Genuine re-layouts: routes toggle (today); hop-depth, selection, layer (Task 6/11). */
    reset() { fitted = false; focusing = false; },
  };
};
