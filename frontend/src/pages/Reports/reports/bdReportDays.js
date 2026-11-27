import { istDayString, shiftDay } from '../../../utils/dateUtils';

/**
 * The day the BD books are closed on: yesterday in IST.
 *
 * IST is UTC+05:30, so the calendar day is read in Asia/Kolkata and not in
 * the browser's zone — at 00:30 IST the day has already rolled over even
 * though UTC still says the day before.
 */
export const yesterdayIST = () => shiftDay(istDayString(), -1);

/** The IST calendar day ('YYYY-MM-DD') of an instant. */
export const todayIST = () => istDayString();
