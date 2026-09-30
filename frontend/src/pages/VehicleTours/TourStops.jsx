import React from 'react';
import dayjs from 'dayjs';
import { Hourglass, Warehouse } from 'lucide-react';
import { PASS_REASON_LABEL } from './tourLogic.js';

const fmt = (d) => (d ? dayjs(d).format('DD MMM, HH:mm') : '—');

/**
 * Yards the truck stopped in without ending the cycle, and a close still waiting
 * on a trip. A tour only ends where the load has come off; these explain why it
 * went on past a yard.
 */
export default function TourStops({ tour }) {
  const held = tour.pendingClose;
  const passed = tour.passedThrough || [];
  if (!held && !passed.length) return null;

  return (
    <section>
      <h4>Yard stops</h4>
      {held && (
        <p className="vtour-note">
          <Hourglass size={12} /> At {held.warehouseName || 'a yard'} since {fmt(held.at)}, waiting
          for {held.tripNumber || 'its trip'} to be closed (or GPS to show the drop) before deciding
          whether this cycle ends here.
        </p>
      )}
      {passed.length > 0 && (
        <ul className="vtour-side-list">
          {passed.map((p) => (
            <li key={`${p.warehouseId}-${p.enteredAt}`}>
              <div>
                <strong>
                  <Warehouse size={12} /> {p.warehouseName || 'Yard'}
                </strong>
                <span className="vtour-muted">
                  {fmt(p.enteredAt)} → {fmt(p.leftAt)}
                </span>
              </div>
              <div className="vtour-side-right">
                <span className="vtour-state">{p.tripNumber || 'trip'} on board</span>
                <span className="vtour-muted">{PASS_REASON_LABEL[p.reason] || 'not the end'}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
