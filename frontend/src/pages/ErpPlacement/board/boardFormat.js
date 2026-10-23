export const money = (n) => (typeof n === 'number' ? `₹${n.toLocaleString('en-IN')}` : '—');
export const dateLabel = (d) => (d ? new Date(d).toLocaleDateString('en-IN') : '—');
