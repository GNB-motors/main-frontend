import { formatInIST } from '../../../utils/dateUtils';
import { timeAgo } from '../../../utils/formatters';
import { RefreshCw } from 'lucide-react';
import AddMenu from './AddMenu.jsx';

export default function PlaceHubHeader({
  tabs,
  tab,
  tabBadge,
  setTab,
  lastRunAt,
  refreshAll,
  loading,
  canEdit,
  allowFuel,
  isMapTab,
  startAdd,
}) {
  return (
    <header className="ph-head">
      <nav className="ph-tabs" aria-label="Place Hub views">
        {tabs.map((t, i) => {
          const TabIcon = t.Icon;
          const firstTable = t.table && !tabs[i - 1]?.table;
          return (
            <span key={t.id} className="ph-tab-slot">
              {firstTable && <span className="ph-tab-sep" aria-hidden="true" />}
              <button
                type="button"
                className={`ph-tab${tab === t.id ? ' is-on' : ''}`}
                aria-current={tab === t.id ? 'page' : undefined}
                title={t.title}
                onClick={() => setTab(t.id)}
              >
                <TabIcon size={15} />
                {t.label}
                {tabBadge[t.id] && <span className="ph-tab-count">{tabBadge[t.id]}</span>}
              </button>
            </span>
          );
        })}
      </nav>

      <div className="ph-actions">
        {lastRunAt && (
          <span className="ph-fresh" title={formatInIST(lastRunAt, 'D MMM YYYY, h:mm a')}>
            Learned {timeAgo(lastRunAt)}
          </span>
        )}
        <button
          type="button"
          className="ph-icon-btn"
          onClick={refreshAll}
          aria-label="Refresh"
          title="Refresh"
        >
          <RefreshCw size={16} className={loading[tab] ? 'ph-spin' : ''} />
        </button>
        {canEdit && (
          <AddMenu
            allowHotspot={allowFuel}
            onAdd={(k) => {
              // Drawing needs the map.
              if (!isMapTab) setTab('places');
              startAdd(k);
            }}
          />
        )}
      </div>
    </header>
  );
}
