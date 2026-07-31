import { ChevronUp, ChevronDown } from 'lucide-react';

/** Sortable-column header indicator. `active` = this column is the current sort key. */
export const SortIcon = ({ active, dir }) => {
  if (!active) return <span className="sort-icon inactive">↕</span>;
  return dir === 'asc'
    ? <ChevronUp size={13} className="sort-icon active" />
    : <ChevronDown size={13} className="sort-icon active" />;
};
