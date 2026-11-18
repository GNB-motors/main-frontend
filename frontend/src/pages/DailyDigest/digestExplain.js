/**
 * What every ⓘ on the Daily digest says, in one place, written for a fleet
 * owner: what this part of the page shows and why it matters to them.
 *
 * Not here on purpose: how a number is computed (detector versions, odometer
 * vs GPS, IST cut-offs, source tables). That is for engineers and lives in the
 * code and the API, not on the owner's screen.
 */
const day = (isToday) => (isToday ? 'today' : 'on this day');

const digestExplain = {
  trips: (isToday) =>
    `How many trips left a pickup ${day(isToday)}. "Usually" is your average for the last 7 days.`,
  loadedKm: () =>
    'How far your trucks drove carrying a load on these trips. Trips still on the road add their distance once it is recorded.',
  extraFuelCost: () =>
    'Diesel money you could have saved: engines idling and trucks using more fuel than expected. It is an estimate, so check before acting.',
  waitingOnYou: () =>
    'Things that need your decision, most urgent first. Open a row to deal with it.',
  goodDrivers: () =>
    "Drivers who did better than your fleet's usual over the last few weeks. Open a name to see why.",
  needsWord: () =>
    "Drivers and trucks that did worse than your fleet's usual over the last few weeks. Open one to see what changed.",
  running: (isToday) =>
    `How far your trucks drove loaded and how far they drove empty ${day(isToday)}. Less empty driving means more earning trips.`,
  fuelWeek: () =>
    'Diesel your engines used each day for the last week. A gap means some trucks sent no fuel readings that day.',
};

export default digestExplain;
