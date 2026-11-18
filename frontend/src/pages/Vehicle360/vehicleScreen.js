/**
 * The screen read — `GET /api/vehicle-profile/:reg/screen` — answers the whole
 * vehicle page in one request (profile, health and overview together).
 *
 * The backend is still building it. Until it answers, the page reads profile,
 * health and overview the old way; a 404 on the screen endpoint is remembered
 * for this tab so the extra call is not repeated for every vehicle.
 */
let unsupported = false;

/** Has this tab already learned that the screen endpoint is not there? */
export const isScreenUnsupported = () => unsupported;

/** Remember it: the screen endpoint answered 404. */
export const markScreenUnsupported = () => {
  unsupported = true;
};

/** Forget it (tests). */
export const resetScreenSupport = () => {
  unsupported = false;
};
