import { Eye, History, Receipt, Store, Truck } from 'lucide-react';
import { DASH, officeRow } from './officeBill';

/**
 * One owner & manager bill, in the shared receipt table.
 *
 * The markup and the classes are the ones the WhatsApp receipt table uses
 * (`ra-table`, `ra-veh-cell`, `ra-badge`, ...), so both queues read the same
 * way and the phone layout works without a second stylesheet.
 */
const OfficeBillRow = ({ capture, index = 0, confirmed = false, onOpen, onHistory }) => {
  const row = officeRow(capture);
  const isConfirmed = row.confirmed || confirmed;
  return (
    <tr
      className="ra-clickable"
      onClick={() => onOpen?.(capture)}
      aria-label={`Bill ${row.id}`}
    >
      {/* The photo opens the same drawer the Review button opens. */}
      <td
        className="ra-table__td-slip"
        data-label="Photo"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="ra-slip-thumbnail"
          onClick={() => onOpen?.(capture)}
          aria-label={`Open bill photo ${index + 1}`}
          title="Open the bill photo"
        >
          <Receipt size={16} />
          <span className="ra-slip-badge">BILL</span>
        </button>
      </td>

      {/* The truck: the plate that was chosen, and what is known about it. */}
      <td data-label="Truck">
        <div className="ra-veh-cell">
          <span className="ra-veh">
            <span className="ra-veh__avatar">
              <Truck size={15} />
            </span>
            <strong>{row.plate || DASH}</strong>
          </span>
          {((row.market && !isConfirmed) || (row.certainty && !isConfirmed)) && (
            <div className="ra-chip-row">
              {row.market && (
                <span
                  className="ra-chip ra-chip--market"
                  title="This bill is not from one of your trucks"
                >
                  <Store size={11} />
                  Market truck?
                </span>
              )}
              {row.certainty && (
                <span
                  className={`ra-chip ${row.certainty.kind === 'sure' ? '' : 'ra-chip--warn'}`}
                  title="What the server thinks of this truck"
                >
                  {row.certainty.text}
                </span>
              )}
            </div>
          )}
          {isConfirmed && (
            <span className="ra-driver-phone">
              {`Confirmed by ${row.confirmedBy} \u00b7 ${row.confirmedVia}`}
            </span>
          )}
        </div>
      </td>

      {/* Who put the bill in. */}
      {/* eslint-disable-next-line jsx-a11y/control-has-associated-label -- a data cell, not a control; its text sits deeper than the rule looks */}
      <td data-label="Uploaded by">
        <div className="ra-driver-cell">
          <span className="ra-driver-name">{row.uploader}</span>
        </div>
      </td>

      {/* The pump the fuel came from. */}
      <td data-label="Pump">
        <div className="ra-station-cell" title={row.pump || undefined}>
          <span className="ra-station-name">{row.pump || DASH}</span>
          {row.fuelType && <span className="ra-station-mode">{row.fuelType}</span>}
        </div>
      </td>

      <td className="ra-right ra-strong font-mono" data-label="Litres">
        {row.litres || DASH}
      </td>

      <td className="ra-right ra-strong font-mono" data-label="Amount">
        {row.amount}
      </td>

      <td className="ra-right font-mono" data-label="Rate">
        {row.rate || DASH}
      </td>

      {/* The date and the time the bill itself shows. */}
      <td className="ra-center" data-label="Bill date/time">
        <div className="ra-time-cell">
          <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>
            {row.date || DASH}
          </div>
          {row.time && (
            <div style={{ fontSize: '11px', opacity: 0.75 }}>{row.time}</div>
          )}
        </div>
      </td>

      {/* What the state of the match is. */}
      <td className="ra-center" data-label="Match status">
        <span
          className={`ra-badge ${
            row.status === 'Confirmed'
              ? 'ra-badge--published'
              : row.status === 'Needs review'
                ? 'ra-badge--ready'
                : 'ra-badge--cleared'
          }`}
        >
          <span className="ra-badge__dot" />
          {row.status}
        </span>
      </td>

      {/* What can be done with this bill. */}
      <td className="ra-center" data-label="Actions" onClick={(e) => e.stopPropagation()}>
        <div className="ra-row-actions">
          <button
            type="button"
            className="ra-action-icon-btn"
            onClick={() => onOpen?.(capture)}
            title="Review this bill"
            aria-label="Review"
          >
            <Eye size={14} />
          </button>
          {isConfirmed && (
            <button
              type="button"
              className="ra-action-icon-btn"
              onClick={() => onHistory?.(capture)}
              title="Open the log of this bill"
              aria-label="Log"
            >
              <History size={14} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default OfficeBillRow;
