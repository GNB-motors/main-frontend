import React from 'react';

function SortTh({ k, label, cls = '', sortKey, sortDir, onSort }) {
  const active = sortKey === k;
  return (
    <th
      className={`sortable ${cls}`}
      aria-sort={active ? (sortDir < 0 ? 'descending' : 'ascending') : undefined}
      onClick={() => onSort(k)}
    >
      {label}
      <span className="arr">{active ? (sortDir < 0 ? '↓' : '↑') : '↕'}</span>
    </th>
  );
}

export default SortTh;
