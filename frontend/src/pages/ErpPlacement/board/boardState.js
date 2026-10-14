/**
 * RETURNING is the state the board could not express before: the load is off, so
 * the tanker can be placed, but it is still running home and those kilometres
 * still belong to the previous trip. It is placeable — ON_TRIP and NEXT_PLANNED
 * are not.
 */
export const BOARD_STATE_LABEL = {
  AVAILABLE: 'Available',
  RETURNING: 'Returning (placeable)',
  NEXT_PLANNED: 'Next trip planned',
  ON_TRIP: 'On trip',
  WAITING_UNLOAD: 'Waiting to unload',
  MAINTENANCE: 'In maintenance',
};

export const BOARD_STATE_TONE = {
  AVAILABLE: 'success',
  RETURNING: 'success',
  NEXT_PLANNED: 'warning',
  ON_TRIP: 'open',
  WAITING_UNLOAD: 'warning',
  MAINTENANCE: 'danger',
};
