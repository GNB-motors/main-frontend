import { formatDuration } from '../../utils/redesign/format';

export const compactDuration = (minutes) =>
  formatDuration(minutes).replace(' h', 'h').replace(' min', 'm');
