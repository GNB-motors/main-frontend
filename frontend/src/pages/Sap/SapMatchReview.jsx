import { useDeferredValue, useState } from 'react';
import revealReview from './revealReview';
import { Link } from 'react-router-dom';
import { Search, ArrowUpRight } from 'lucide-react';
import { toast } from 'react-toastify';
import PageShell from '../../components/ui/PageShell';
import DataTable from '../../components/ui/DataTable';
import EnterprisePagination from '../../components/ui/EnterprisePagination';
import { Button } from '../../components/ui/button';
import useApi from '../../hooks/useApi';
import useMutation from '../../hooks/useMutation';
import SapService from '../../services/SapService';
import SapRequestState from './SapRequestState';
import SapReviewDetail from './SapReviewDetail';
import { reviewRows, reviewKey } from './sapReviewModel';
import { canEditSap } from './sapModel';
import { getUserRole } from '../../utils/session';
const PAGE_SIZE = 12;
export default function SapMatchReview() {
  const q = useApi((signal) => SapService.matchReview({ signal }), []);
  const m = useMutation(SapService.alias);
  const canEdit = canEditSap(getUserRole());
  const [kind, setKind] = useState('DROP');
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState('pending');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const term = useDeferredValue(search);
  const rows = reviewRows(q.data, kind, term, scope);
  const currentPage = Math.min(page, Math.max(1, Math.ceil(rows.length / PAGE_SIZE)));
  const visible = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const current = visible.find((r) => reviewKey(r, kind) === selected) || visible[0];
  const alias = async (aliasKind, label, orgSiteId, status = 'CONFIRMED') => {
    try {
      await m.mutate({ kind: aliasKind, label, orgSiteId, status });
      q.refetch();
      toast.success('SAP updated — trips refresh shortly');
    } catch (e) {
      toast.error(e?.message || 'Could not link place');
    }
  };
  const plant = kind === 'PLANT';
  const columns = [
    {
      key: 'place',
      label: plant ? 'Sheet plant' : 'Drop place',
      render: (r) => (
        <>
          <span className="sap-cell-title">{r.name || r.label || 'Unnamed drop'}</span>
          <span className="sap-cell-sub">
            {plant
              ? (r.sites || []).map((s) => s.name).join(', ') || 'No place linked'
              : r.label || 'No sheet label linked'}
          </span>
        </>
      ),
    },
    {
      key: 'impact',
      label: plant ? 'Lanes' : 'Trips affected',
      align: 'right',
      render: (r) => (plant ? (r.laneCount ?? 0) : (r.tripCount ?? 0)),
    },
    {
      key: 'actions',
      label: '',
      align: 'right',
      render: (r) => (
        <Button
          variant="ghost"
          size="sm"
          aria-pressed={reviewKey(r, kind) === reviewKey(current || {}, kind)}
          onClick={(e) => {
            e.stopPropagation();
            setSelected(reviewKey(r, kind));
            revealReview('sap-review-detail');
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
      title="Link SAP sheet to places"
      subtitle="Connect sheet labels to the places your trucks visit. Start with the drops affecting the most trips."
    >
      <div className="sap-toolbar">
        <div className="sap-tabs" aria-label="Place category">
          {[
            ['DROP', 'Drop places', q.data?.drops?.length],
            ['PLANT', 'Sheet plants', q.data?.plants?.length],
            ['UNNAMED', 'Unnamed drops', q.data?.unnamedDrops?.count],
          ].map(([id, label, count]) => (
            <button
              className="sap-tab"
              type="button"
              key={id}
              aria-pressed={kind === id}
              onClick={() => {
                setKind(id);
                setSelected(null);
                setPage(1);
                setSearch('');
              }}
            >
              {label}
              <span className="sap-tab-count">{count ?? '—'}</span>
            </button>
          ))}
        </div>
        <span className="sap-muted">{q.data?.unusedLabels ?? 0} unused sheet labels</span>
      </div>
      <SapRequestState query={q}>
        {kind === 'UNNAMED' ? (
          <section className="sap-card">
            <div className="sap-toolbar">
              <div className="sap-stack">
                <h2>Give these drops a name</h2>
                <p className="sap-muted">Name the place before linking it to a SAP destination.</p>
              </div>
              <Link className="sap-link" to="/place-hub">
                Open Place Hub <ArrowUpRight size={14} />
              </Link>
            </div>
            <DataTable
              className="sap-table"
              columns={[
                { key: 'coordinates', label: 'Coordinates', render: (r) => `${r.lat}, ${r.lng}` },
                {
                  key: 'trips',
                  label: 'Trips affected',
                  align: 'right',
                  render: (r) => r.tripCount,
                },
              ]}
              rows={q.data?.unnamedDrops?.top || []}
              rowKey={(r) => `${r.lat}:${r.lng}`}
              emptyTitle="No unnamed drops waiting for review"
            />
          </section>
        ) : (
          <>
            <div className="sap-toolbar">
              <div className="sap-search">
                <Search size={16} aria-hidden="true" />
                <input
                  type="search"
                  aria-label="Search SAP links"
                  placeholder={plant ? 'Search sheet plants…' : 'Search drop places…'}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <label className="sap-row">
                Show
                <select
                  aria-label="Link status"
                  value={scope}
                  onChange={(e) => {
                    setScope(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="pending">Needs linking</option>
                  <option value="all">All places</option>
                </select>
              </label>
            </div>
            <div className="sap-review-layout">
              <DataTable
                className="sap-table"
                columns={columns}
                rows={visible}
                total={rows.length}
                rowKey={(r) => reviewKey(r, kind)}
                onRowClick={(r) => {
                  setSelected(reviewKey(r, kind));
                  revealReview('sap-review-detail');
                }}
                rowClassName={(r) => (r === current ? 'dt-row--selected' : '')}
                emptyTitle="No places in this view"
                emptyHint="Try another search or show all places."
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
              <SapReviewDetail
                key={`${kind}:${reviewKey(current || {}, kind)}`}
                row={current}
                kind={kind}
                canEdit={canEdit}
                busy={m.loading}
                onAlias={alias}
              />
            </div>
          </>
        )}
      </SapRequestState>
    </PageShell>
  );
}
