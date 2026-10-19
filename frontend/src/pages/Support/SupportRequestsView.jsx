import { Plus, Search } from 'lucide-react';
import DataTable from '../../components/ui/DataTable';
import EnterprisePagination from '../../components/ui/EnterprisePagination';
import { Button } from '../../components/ui/button';
import SupportSelect from '../../components/support/SupportSelect';
import { label } from '../../lib/vocabulary';
import { RANGE_PRESETS } from '../../lib/supportTicket';
import SupportStatCards from './SupportStatCards';
import supportColumns from './supportColumns';
import useSupportRequests from './useSupportRequests';

const RANGE_OPTIONS = RANGE_PRESETS.map((p) => ({ value: p.key, label: p.label }));
const PAGE_SIZES = [10, 25, 50];
const COLUMNS = supportColumns();

/** The portal's landing view: counters, filters and the org's request table. */
export default function SupportRequestsView({ onOpenTicket, onNewRequest }) {
  const { filters, dispatch, list, summary, requesters } = useSupportRequests();

  const requesterOptions = [
    { value: '', label: 'All requesters' },
    ...(requesters.data || []).map((r) => ({ value: String(r.userId), label: r.name })),
  ];

  const rows = list.data?.items || [];
  const pagination = list.data?.pagination;
  const total = pagination?.total ?? rows.length;
  const tabLabel = filters.status ? label('supportStatus', filters.status) : 'All requests';
  const filtered = Boolean(
    filters.status || filters.requesterId || filters.q || filters.range !== 'all',
  );

  return (
    <div className="sp-view">
      <div className="sp-titlebar">
        <div>
          <h2 className="sp-title">Support requests</h2>
          <p className="sp-subtitle">
            Report a problem and follow every reply from our team, all in one place.
          </p>
        </div>
        <div className="sp-titlebar-actions">
          <SupportSelect
            value={filters.range}
            onChange={(value) => dispatch({ type: 'range', value: value || 'all' })}
            options={RANGE_OPTIONS}
            ariaLabel="Created in"
            className="min-w-[150px]"
          />
          <Button onClick={onNewRequest}>
            <Plus size={16} aria-hidden="true" />
            New request
          </Button>
        </div>
      </div>

      <SupportStatCards
        summary={summary.data}
        loading={summary.loading}
        activeStatus={filters.status}
        onSelect={(value) => dispatch({ type: 'status', value })}
      />

      <section className="sp-card" aria-label="Requests">
        <div className="sp-card-toolbar">
          <div className="sp-card-toolbar-left">
            <span className="sp-tab">
              {tabLabel}
              <span className="sp-tab-count">{total}</span>
            </span>
            <SupportSelect
              value={filters.requesterId}
              onChange={(value) => dispatch({ type: 'requester', value })}
              options={requesterOptions}
              ariaLabel="Requester"
              className="min-w-[180px]"
            />
          </div>
          <label className="sp-search">
            <Search size={15} aria-hidden="true" />
            <input
              type="search"
              value={filters.q}
              onChange={(e) => dispatch({ type: 'search', value: e.target.value })}
              placeholder="Search subject or ticket #"
              aria-label="Search requests"
            />
          </label>
        </div>

        <DataTable
          columns={COLUMNS}
          rows={rows}
          rowKey={(row) => row._id}
          rowClassName={(row) => (row.unreadForOrg ? 'sp-row--unread' : '')}
          loading={list.loading}
          error={list.error}
          onRetry={list.refetch}
          sortBy={filters.sortBy}
          sortOrder={filters.order}
          onSort={(key, order) => dispatch({ type: 'sort', key, order })}
          showing={rows.length}
          total={total}
          onRowClick={(row) => onOpenTicket(row._id)}
          emptyTitle={filtered ? 'No requests match these filters' : 'No requests yet'}
          emptyHint={
            filtered
              ? 'Clear a filter or widen the date range.'
              : 'Something not working? Raise a request and our team will reply here.'
          }
          emptyAction={
            filtered ? null : (
              <Button variant="outline" size="sm" onClick={onNewRequest}>
                <Plus size={14} aria-hidden="true" />
                New request
              </Button>
            )
          }
          pagination={
            pagination && pagination.totalPages > 1 ? (
              <EnterprisePagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                pageSize={filters.limit}
                pageSizeOptions={PAGE_SIZES}
                onPageChange={(value) => dispatch({ type: 'page', value })}
                onPageSizeChange={(value) => dispatch({ type: 'pageSize', value })}
              />
            ) : null
          }
        />
      </section>
    </div>
  );
}
