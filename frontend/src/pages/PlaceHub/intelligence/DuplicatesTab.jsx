import { useDeferredValue, useState } from 'react';
import revealReview from '../../Sap/revealReview';
import { Search, MapPinned } from 'lucide-react';
import PageShell from '../../../components/ui/PageShell';
import DataTable from '../../../components/ui/DataTable';
import EnterprisePagination from '../../../components/ui/EnterprisePagination';
import { Button } from '../../../components/ui/button';
import useApi from '../../../hooks/useApi';
import PlaceIntelligenceService from './PlaceIntelligenceService';
import SapRequestState from '../../Sap/SapRequestState';
import PlacePicker from '../../Sap/PlacePicker';
import DuplicatePair from './DuplicatePair';
import MergeHistory from './MergeHistory';
import '../../Sap/Sap.css';
const keyOf = (pair) => `${pair.a._id}:${pair.b._id}`;
const PAGE_SIZE = 12;
export default function DuplicatesTab({ version, onChanged }) {
  const q = useApi((signal) => PlaceIntelligenceService.duplicates({ signal }), [version]);
  const [survivorId, setSurvivorId] = useState('');
  const [historyVersion, setHistoryVersion] = useState(0);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const term = useDeferredValue(search).trim().toLocaleLowerCase();
  const changed = (id) => {
    if (id) setSurvivorId(id);
    setHistoryVersion((v) => v + 1);
    q.refetch();
    onChanged?.();
  };
  const pairs = Array.isArray(q.data) ? q.data : q.data?.pairs || q.data?.records || [];
  const rows = pairs.filter(
    (p) => !term || `${p.a.name || ''} ${p.b.name || ''}`.toLocaleLowerCase().includes(term),
  );
  const currentPage = Math.min(page, Math.max(1, Math.ceil(rows.length / PAGE_SIZE)));
  const visible = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const current = visible.find((p) => keyOf(p) === selected) || visible[0];
  const columns = [
    {
      key: 'places',
      label: 'Possible duplicate',
      render: (p) => (
        <>
          <span className="sap-cell-title">{p.a.name || 'Unnamed place'}</span>
          <span className="sap-cell-sub">{p.b.name || 'Unnamed place'}</span>
        </>
      ),
    },
    {
      key: 'distance',
      label: 'Apart',
      align: 'right',
      render: (p) => (p.distanceM == null ? '—' : `${Math.round(p.distanceM)} m`),
    },
    { key: 'impact', label: 'Trips', align: 'right', render: (p) => p.tripsAffected ?? '—' },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (p) => (
        <Button
          variant="ghost"
          size="sm"
          aria-pressed={p === current}
          onClick={(e) => {
            e.stopPropagation();
            setSelected(keyOf(p));
            revealReview('duplicate-review-detail');
          }}
        >
          Review
        </Button>
      ),
    },
  ];
  return (
    <PageShell
      className="sap-panel sap-page"
      title="Same place?"
      count={q.data ? pairs.length : null}
      subtitle="Review nearby places using their visits, route distance and mapped-place evidence."
    >
      <div className="sap-toolbar">
        <div className="sap-search">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            aria-label="Search possible duplicates"
            placeholder="Search place names…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <span className="sap-muted">Select a pair to compare and review</span>
      </div>
      <SapRequestState query={q}>
        <div className="sap-review-layout">
          <DataTable
            className="sap-table"
            columns={columns}
            rows={visible}
            total={rows.length}
            rowKey={keyOf}
            rowClassName={(p) => (p === current ? 'dt-row--selected' : '')}
            onRowClick={(p) => {
              setSelected(keyOf(p));
              revealReview('duplicate-review-detail');
            }}
            emptyTitle={
              search ? 'No places match your search' : 'No possible duplicates waiting for review'
            }
            emptyHint={
              search
                ? 'Try another place name.'
                : 'New candidates appear here when nearby places need a check.'
            }
            pagination={
              <EnterprisePagination
                page={currentPage}
                totalPages={Math.max(1, Math.ceil(rows.length / PAGE_SIZE))}
                totalItems={rows.length || null}
                pageSize={PAGE_SIZE}
                onPageChange={(next) => {
                  setPage(next);
                  setSelected(null);
                }}
              />
            }
          />
          {current ? (
            <DuplicatePair key={keyOf(current)} pair={current} onChanged={changed} />
          ) : (
            <aside className="sap-card sap-empty">
              <MapPinned size={28} />
              <p>Select a place pair to compare its map and visit history.</p>
            </aside>
          )}
        </div>
      </SapRequestState>
      <details className="sap-disclosure sap-history">
        <summary>Merge history and undo</summary>
        <div className="sap-stack">
          <p className="sap-muted">
            Find the place you kept to review or undo its previous merges.
          </p>
          <PlacePicker label="Find the surviving place" onChoose={setSurvivorId} />
          {/^[a-f0-9]{24}$/i.test(survivorId) && (
            <MergeHistory
              survivorId={survivorId}
              version={historyVersion}
              onChanged={() => changed()}
            />
          )}
        </div>
      </details>
    </PageShell>
  );
}
