import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { PageHeader } from '../../../Drivers/Component';
import DataTable from '../../../../components/ui/DataTable';
import EnterprisePagination from '../../../../components/ui/EnterprisePagination';
import SupportSelect from '../../../../components/support/SupportSelect';
import DateRangeFilter from '../DateRangeFilter';
import { label } from '../../../../lib/vocabulary';
import { ENQUIRY_STATUSES } from '../../../../lib/enquiry';
import { getUserRole } from '../../../../utils/session';
import enquiryColumns from './enquiryColumns';
import EnquiryDrawer from './EnquiryDrawer';
import useEnquiryInbox from './useEnquiryInbox';
import '../supportTickets/SupportTickets.css';
import './Enquiries.css';

const COLUMNS = enquiryColumns();
const PAGE_SIZES = [10, 25, 50, 100];
const STATUS_OPTIONS = [
  { value: '', label: 'Any status' },
  ...ENQUIRY_STATUSES.map((s) => ({ value: s, label: label('enquiryStatus', s) })),
];
const KPIS = [
  { key: 'new', status: 'NEW', label: 'New', hint: 'nobody has picked these up' },
  { key: 'contacted', status: 'CONTACTED', label: 'Contacted', hint: 'we reached out' },
  { key: 'closed', status: 'CLOSED', label: 'Closed', hint: 'done, or not a fit' },
  { key: 'all', status: '', label: 'All enquiries', hint: 'in this period' },
];

/** Super-admin inbox for enquiries sent from the public Contact page. */
export default function EnquiriesPage() {
  const navigate = useNavigate();
  const { filters, update, list, summary } = useEnquiryInbox();
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (getUserRole() !== 'SUPER_ADMIN') navigate('/profile');
  }, [navigate]);

  const rows = list.data?.items || [];
  const pagination = list.data?.pagination;
  const filtered = Boolean(filters.status || filters.q || filters.from);

  const onUpdated = (enquiry) => {
    setSelected(enquiry);
    list.refetch();
    summary.refetch();
  };

  return (
    <div className="sat-page">
      <PageHeader
        showBreadcrumb={false}
        title="Enquiries"
        description="Sent from the Contact page on the website by people who don't have a GNB account yet. Reply by phone or email, then mark them contacted."
      />

      <div className="sat-kpis enq-kpis">
        {KPIS.map((kpi) => {
          const value = summary.data?.[kpi.key];
          const active = filters.status === kpi.status;
          return (
            <button
              key={kpi.key}
              type="button"
              className={`sat-kpi enq-kpi--${kpi.key}${active ? ' sat-kpi--active' : ''}`}
              aria-pressed={active}
              onClick={() => update({ status: kpi.status })}
            >
              <span className="sat-kpi-label">{kpi.label}</span>
              <span className="sat-kpi-value">
                {summary.error || (summary.loading && value == null) ? '—' : (value ?? 0)}
              </span>
              <span className="sat-kpi-hint">{kpi.hint}</span>
            </button>
          );
        })}
      </div>

      <section className="sat-card">
        <div className="sat-toolbar">
          <div className="sat-filters">
            <SupportSelect
              value={filters.status}
              onChange={(status) => update({ status })}
              options={STATUS_OPTIONS}
              ariaLabel="Status"
              className="min-w-[160px]"
            />
            <DateRangeFilter
              value={{ startDate: filters.from || null, endDate: filters.to || null }}
              onChange={({ startDate, endDate }) => update({ from: startDate, to: endDate })}
            />
          </div>
          <label className="sat-search">
            <Search size={15} aria-hidden="true" />
            <input
              type="search"
              value={filters.q}
              onChange={(e) => update({ q: e.target.value })}
              placeholder="Name, company, email or phone"
              aria-label="Search enquiries"
            />
          </label>
        </div>

        <DataTable
          columns={COLUMNS}
          rows={rows}
          rowKey={(row) => row._id}
          rowClassName={(row) => (row.status === 'NEW' ? 'sat-row--unread' : '')}
          loading={list.loading}
          error={list.error}
          onRetry={list.refetch}
          sortBy="createdAt"
          sortOrder={filters.order}
          // Received is the only sort: each click flips newest-first / oldest-first.
          onSort={() => update({ order: filters.order === 'desc' ? 'asc' : '' })}
          showing={rows.length}
          total={pagination?.total ?? rows.length}
          onRowClick={(row) => setSelected(row)}
          emptyTitle={filtered ? 'No enquiries match these filters' : 'No enquiries yet'}
          emptyHint={
            filtered
              ? 'Clear a filter or widen the date range.'
              : 'Enquiries sent from the Contact page on the website land here.'
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
      </section>

      <EnquiryDrawer enquiry={selected} onClose={() => setSelected(null)} onUpdated={onUpdated} />
    </div>
  );
}
