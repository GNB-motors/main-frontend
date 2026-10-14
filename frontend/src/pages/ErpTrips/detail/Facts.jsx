import React from 'react';

const Facts = ({ items }) => (
  <dl className="trip360-kv">
    {items
      .filter((f) => f)
      .map((f) => (
        <React.Fragment key={f.label}>
          <dt>{f.label}</dt>
          <dd>{f.value ?? '—'}</dd>
        </React.Fragment>
      ))}
  </dl>
);

export default Facts;
