import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { PageHeader } from '../../../Drivers/Component';
import DataTable from '../../../../components/ui/DataTable';
import EnterprisePagination from '../../../../components/ui/EnterprisePagination';
import SupportSelect from '../../../../components/support/SupportSelect';
import DateRangeFilter from '../DateRangeFilter';
import { label } from '../../../../lib/vocabulary';
import { SUPPORT_PRIORITIES, SUPPORT_STATUSES } from '../../../../lib/supportTicket';
import { getUserRole } from '../../../../utils/session';
import SupportAdminKpis from './SupportAdminKpis';
import SupportByOrgTable from './SupportByOrgTable';
import supportAdminColumns from './supportAdminColumns';
import useSupportAdminInbox from './useSupportAdminInbox';
import './SupportTickets.css';

const COLUMNS = supportAdminColumns();
const PAGE_SIZES = [10, 25, 50, 100];
const STATUS_OPTIONS = [
  { value: '', label: 'Any status' },
  ...SUPPORT_STATUSES.map((s) => ({ value: s, label: label('supportStatusAdmin', s) })),
];
const PRIORITY_OPTIONS = [
  { value: '', label: 'Any priority' },
  ...SUPPORT_PRIORITIES.map((p) => ({ value: p, label: label('supportPriority', p) })),
];

/** Super-admin inbox: every org's support tickets, as a list or grouped by organization. */
export default function SupportTicketsPage() {
  const navigate = useNavigate();
  const { filters, update, list, summary, byOrg, orgs } = useSupportAdminInbox();

  useEffect(() => {
    if (getUserRole() !== 'SUPER_ADMIN') navigate('/profile');
  }, [navigate]);

  const orgOptions = [
    { value: '', label: 'All organizations' },
    ...(orgs.data || []).map((o) => ({ value: o._id, label: o.companyName || o.ownerEmail })),
  ];
  const rows = list.data?.items || [];
  const pagination = list.data?.pagination;
  const filtered = Boolean(
    filters.orgId ||
    filters.status ||
    filters.priority ||
    filters.unread ||
    filters.q ||
    filters.from,
  );

  return (
    <div className="sat-page">
      <PageHeader
        showBreadcrumb={false}
        title="Support Tickets"
        description="Requests raised by organizations from the headset icon. Replies show up in their Support Portal."
      />

      <SupportAdminKpis
        summary={summary.data}
        loading={summary.loading}
        filters={filters}
        onSelect={(filter) => update({ ...filter, view: '' })}
      />

      <section className="sat-card">
        <div className="sat-toolbar">
          <div className="sat-view-toggle" role="tablist" aria-label="View">
            <button
              type="button"
              role="tab"
              aria-selected={filters.view === 'tickets'}
              className={filters.view === 'tickets' ? 'is-active' : ''}
              onClick={() => update({ view: '' })}
            >
              All tickets
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filters.view === 'orgs'}
              className={filters.view === 'orgs' ? 'is-active' : ''}
              onClick={() => update({ view: 'orgs' })}
            >
              By organization
            </button>
          </div>

          <div className="sat-filters">
            {filters.view === 'tickets' ? (
              <>
                <SupportSelect
                  value={filters.orgId}
                  onChange={(orgId) => update({ orgId })}
                  options={orgOptions}
                  ariaLabel="Organization"
                  className="min-w-[200px]"
                />
                <SupportSelect
                  value={filters.status}
                  onChange={(status) => update({ status, unread: false })}
                  options={STATUS_OPTIONS}
                  ariaLabel="Status"
                  className="min-w-[160px]"
                />
                <SupportSelect
                  value={filters.priority}
                  onChange={(priority) => update({ priority })}
                  options={PRIORITY_OPTIONS}
                  ariaLabel="Priority"
                  className="min-w-[140px]"
                />
              </>
            ) : null}
            <DateRangeFilter
              value={{ startDate: filters.from || null, endDate: filters.to || null }}
              onChange={({ startDate, endDate }) => update({ from: startDate, to: endDate })}
            />
            {filters.view === 'tickets' ? (
              <label className="sat-search">
                <Search size={15} aria-hidden="true" />
                <input
                  type="search"
                  value={filters.q}
                  onChange={(e) => update({ q: e.target.value })}
                  placeholder="Subject, ticket # or requester"
                  aria-label="Search tickets"
                />
              </label>
            ) : null}
          </div>
        </div>

        {filters.view === 'orgs' ? (
          <SupportByOrgTable query={byOrg} onSelectOrg={(orgId) => update({ view: '', orgId })} />
        ) : (
          <DataTable
            columns={COLUMNS}
            rows={rows}
            rowKey={(row) => row._id}
            rowClassName={(row) => (row.unreadForSupport ? 'sat-row--unread' : '')}
            loading={list.loading}
            error={list.error}
            onRetry={list.refetch}
            sortBy={filters.sortBy}
            sortOrder={filters.order}
            onSort={(sortBy, order) =>
              update(order ? { sortBy, order } : { sortBy: '', order: '' })
            }
            showing={rows.length}
            total={pagination?.total ?? rows.length}
            onRowClick={(row) => navigate(`/superadmin/support-tickets/${row._id}`)}
            emptyTitle={filtered ? 'No tickets match these filters' : 'No support tickets yet'}
            emptyHint={
              filtered
                ? 'Clear a filter or widen the date range.'
                : 'Tickets raised from the headset icon in the app land here.'
            }
            pagination={
              pagination && pagination.totalPages > 1 ? (
                <EnterprisePagination
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                  totalItems={pagination.total}
                  pageSize={filters.limit}
                  pageSizeOptions={PAGE_SIZES}
                  onPageChange={(page) => update({ page }, { keepPage: true })}
                  onPageSizeChange={(limit) => update({ limit })}
                />
              ) : null
            }
          />
        )}
      </section>
    </div>
  );
}
