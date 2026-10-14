export const num = (v) => (v == null || Number.isNaN(Number(v)) ? null : Number(v));

export const L1 = (v) => (num(v) == null ? '—' : `${num(v).toFixed(1)} L`);

export const signedL1 = (v) =>
  num(v) == null ? '—' : `${num(v) > 0 ? '+' : ''}${num(v).toFixed(1)} L`;

export const L0 = (v) =>
  num(v) == null ? null : `${Math.round(num(v)).toLocaleString('en-IN')} L`;
