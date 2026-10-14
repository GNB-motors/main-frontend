import { Link } from 'react-router-dom';
import BOARD_COLUMNS from './boardColumns';
import NextActionCell from './NextActionCell';
import AgeingFlag from './AgeingFlag';

const TripBoard = ({ grouped, loading }) => (
  <div className="trippipe-board">
    {BOARD_COLUMNS.map((col) => {
      const items = grouped[col.state] || [];
      return (
        <section key={col.state} className="trippipe-col">
          <header className="trippipe-col-head">
            {col.label}
            <span className="trippipe-col-count">{items.length}</span>
          </header>
          <div className="trippipe-col-body">
            {loading ? (
              <p className="trippipe-col-empty">Loading…</p>
            ) : items.length === 0 ? (
              <p className="trippipe-col-empty">Nothing here.</p>
            ) : (
              items.map((t) => (
                <Link key={t._id} to={`/erp/trips/${t._id}`} className="trippipe-card">
                  <div className="trippipe-card-top">
                    <span className="trippipe-card-no">{t.tripNumber}</span>
                    <span style={{ marginLeft: 'auto' }}>
                      <AgeingFlag trip={t} />
                    </span>
                  </div>
                  <div className="trippipe-card-meta">
                    {t.vehicleNumber || '—'} · {t.partyId?.name || '—'}
                    <br />
                    {t.fromLocation ? `${t.fromLocation} → ${t.toLocation}` : '—'}
                  </div>
                  <div className="trippipe-card-foot">
                    <NextActionCell trip={t} />
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      );
    })}
  </div>
);

export default TripBoard;
