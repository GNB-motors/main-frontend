import { Link } from 'react-router-dom';
import { Link2, ArrowUpRight, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/button';
import PlacePicker from './PlacePicker';
import SapLabelPicker from './SapLabelPicker';
import { uniqueSuggestions } from './sapReviewModel';
export default function SapReviewDetail({ row, kind, canEdit, busy, onAlias }) {
  if (!row)
    return (
      <aside className="sap-card sap-empty">
        <Link2 size={28} />
        <p>Select a place to review its SAP link.</p>
      </aside>
    );
  const plant = kind === 'PLANT';
  const suggestions = uniqueSuggestions(row.suggestions, kind);
  const linked = plant ? (row.sites || []).map((s) => s.name).join(', ') : row.label;
  return (
    <aside
      className="sap-card sap-review-detail"
      id="sap-review-detail"
      aria-label="Selected SAP link"
    >
      <div className="sap-detail-title">
        <span className="sap-muted">{plant ? 'SHEET PLANT' : 'DROP PLACE'}</span>
        <h2>{row.name || row.label || 'Unnamed drop'}</h2>
        <p>
          {plant ? `${row.laneCount ?? 0} sheet lanes` : `${row.tripCount ?? 0} trips affected`}
        </p>
        <span className={`sap-pill ${linked ? 'sap-pill--within' : 'sap-pill--under'}`}>
          {linked ? 'Linked' : 'Needs linking'}
        </span>
      </div>
      <div className="sap-stack">
        <h4>{plant ? 'Linked places' : 'Current sheet label'}</h4>
        <p className="sap-muted">{linked || 'No link confirmed yet.'}</p>
      </div>
      {canEdit && (
        <>
          <div className="sap-stack">
            <h4 className="sap-row">
              <Sparkles size={14} aria-hidden="true" />
              Suggested matches
            </h4>
            {!suggestions.length && (
              <p className="sap-muted">No suggestions yet. Search below to choose a match.</p>
            )}
            {suggestions.map((s) => (
              <div className="sap-suggestion" key={plant ? s.orgSiteId || s._id : s.label}>
                <strong>{s.name || s.label}</strong>
                <p className="sap-muted">
                  {Math.round((s.score ?? 0) * 100)}% name match
                  {!plant && s.sapValues?.length ? ` · ${s.sapValues.join(' / ')} km` : ''}
                </p>
                <div className="sap-row">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() =>
                      onAlias(
                        kind,
                        plant ? row.label : s.label,
                        plant ? s.orgSiteId || s._id : row.orgSiteId,
                      )
                    }
                  >
                    Confirm{plant ? ' suggested place' : ''}
                  </Button>
                  {!plant && (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => onAlias(kind, s.label, row.orgSiteId, 'REJECTED')}
                    >
                      Not this one
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="sap-stack">
            <h4>Choose another match</h4>
            {plant ? (
              <PlacePicker
                label="Search a plant place"
                disabled={busy}
                onChoose={(id) => onAlias(kind, row.label, id)}
              />
            ) : (
              <SapLabelPicker
                kind="DROP"
                disabled={busy}
                onChoose={(label) => onAlias(kind, label, row.orgSiteId)}
              />
            )}
          </div>
          {!plant && (
            <Link
              className="sap-link"
              to={`/auto-trips?dropSiteId=${encodeURIComponent(row.orgSiteId)}&dropName=${encodeURIComponent(row.name || 'Unnamed drop')}&range=all`}
            >
              Set SAP km manually on a trip <ArrowUpRight size={14} />
            </Link>
          )}
        </>
      )}
    </aside>
  );
}
