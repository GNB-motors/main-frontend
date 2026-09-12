import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Plus } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import PageShell from '../../components/ui/PageShell';
import FilterBar from '../../components/ui/FilterBar';
import DataTable from '../../components/ui/DataTable';
import './TripManagementPage.css';
import { TripService } from './services';
import { buildTripManagementColumns } from './tripManagementColumns';
import { PAGE_SIZE, filterTrips, renderPageItems } from './tripManagementUtils';

const TABS = [
  { key: 'trips', label: 'Trips' },
  { key: 'refuel', label: 'Refuel Journeys' },
];

const TripManagementPage = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('trips');
  const [searchQuery, setSearchQuery] = useState('');

  const [weightSlipTrips, setWeightSlipTrips] = useState([]);
  const [loadingWeightSlipTrips, setLoadingWeightSlipTrips] = useState(false);
  const [weightSlipPagination, setWeightSlipPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
  });

  const [refuelTrips, setRefuelTrips] = useState([]);
  const [loadingRefuelTrips, setLoadingRefuelTrips] = useState(false);
  const [refuelPagination, setRefuelPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0 });

  useEffect(() => {
    const el = document.querySelector('.page-content');
    if (el) el.classList.add('no-padding');
    return () => {
      if (el) el.classList.remove('no-padding');
    };
  }, []);

  const fetchWeightSlipTrips = async () => {
    // The weight-slip trip flow was removed; there is no data source until the
    // ERP-trip migration (D1). Show an empty list rather than calling a dead API.
    setLoadingWeightSlipTrips(true);
    try {
      setWeightSlipTrips([]);
      setWeightSlipPagination((p) => ({ ...p, total: 0 }));
    } finally {
      setLoadingWeightSlipTrips(false);
    }
  };

  const fetchRefuelTrips = async () => {
    setLoadingRefuelTrips(true);
    try {
      const res = await TripService.getAllTrips({
        page: refuelPagination.page,
        limit: refuelPagination.limit,
      });
      setRefuelTrips(res.data || []);
      const total = res.pagination?.total ?? res.total ?? res.totalResults ?? res.meta?.total ?? 0;
      setRefuelPagination((p) => ({ ...p, total }));
    } catch {
      toast.error('Failed to load refuel journeys');
    } finally {
      setLoadingRefuelTrips(false);
    }
  };

  const activePagination = activeTab === 'trips' ? weightSlipPagination : refuelPagination;
  const setActivePagination = activeTab === 'trips' ? setWeightSlipPagination : setRefuelPagination;

  useEffect(() => {
    setActivePagination((p) => ({ ...p, page: 1 }));
    if (activeTab === 'trips') fetchWeightSlipTrips();
    else fetchRefuelTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'trips') fetchWeightSlipTrips();
    else fetchRefuelTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weightSlipPagination.page, refuelPagination.page]);

  useEffect(() => {
    const h = () => navigate('/trip/new');
    window.addEventListener('startNewTrip', h);
    return () => window.removeEventListener('startNewTrip', h);
  }, [navigate]);

  // Receive search input from the Navbar
  useEffect(() => {
    const handleSearch = (e) => {
      const value = e.detail?.value ?? '';
      setSearchQuery(value);
      setWeightSlipPagination((p) => ({ ...p, page: 1 }));
      setRefuelPagination((p) => ({ ...p, page: 1 }));
    };
    window.addEventListener('tripSearchChange', handleSearch);
    return () => window.removeEventListener('tripSearchChange', handleSearch);
  }, []);

  // Reset Navbar search on unmount
  useEffect(
    () => () => {
      window.dispatchEvent(new CustomEvent('tripSearchReset', { detail: { value: '' } }));
    },
    [],
  );

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearchQuery('');
    window.dispatchEvent(new CustomEvent('tripSearchReset', { detail: { value: '' } }));
  };

  const isLoading = activeTab === 'trips' ? loadingWeightSlipTrips : loadingRefuelTrips;
  const filteredTrips = filterTrips(
    activeTab === 'trips' ? weightSlipTrips : refuelTrips,
    searchQuery,
    activeTab,
  );
  const columns = buildTripManagementColumns(activeTab);
  const totalPages = Math.ceil(activePagination.total / activePagination.limit) || 1;
  const tabLabel = activeTab === 'trips' ? 'trips' : 'refuel journeys';

  return (
    <PageShell
      title="Trip Management"
      count={activePagination.total}
      filters={
        <FilterBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={`Search ${tabLabel}…`}
          chips={TABS}
          selectedKeys={[activeTab]}
          onToggleChip={switchTab}
        />
      }
      footer={`Showing ${filteredTrips.length} of ${activePagination.total} ${tabLabel}`}
    >
      <DataTable
        columns={columns}
        rows={filteredTrips}
        rowKey={(trip) => trip._id}
        loading={isLoading}
        showing={filteredTrips.length}
        total={activePagination.total}
        onRowClick={(trip) =>
          navigate(
            activeTab === 'trips'
              ? `/trip-management/weight-slip/${trip._id}`
              : `/trip-management/trip/${trip._id}`,
          )
        }
        emptyTitle={`No ${tabLabel} found`}
        emptyHint={searchQuery ? 'Try adjusting your search' : null}
        emptyAction={
          !searchQuery ? (
            <button className="empty-action-btn" onClick={() => navigate('/trip/new')}>
              <Plus size={16} /> Start New Trip
            </button>
          ) : null
        }
      />

      {!isLoading && filteredTrips.length > 0 && totalPages > 1 && (
        <div className="pagination-wrapper">
          <Pagination className="justify-end">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() =>
                    activePagination.page > 1 &&
                    setActivePagination((p) => ({ ...p, page: p.page - 1 }))
                  }
                  className={activePagination.page <= 1 ? 'pointer-events-none opacity-40' : ''}
                />
              </PaginationItem>

              {renderPageItems(totalPages, activePagination.page).map((item, idx) =>
                item === '...' ? (
                  <PaginationItem key={`e-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={item}>
                    <PaginationLink
                      isActive={activePagination.page === item}
                      onClick={() => setActivePagination((p) => ({ ...p, page: item }))}
                    >
                      {item}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    activePagination.page < totalPages &&
                    setActivePagination((p) => ({ ...p, page: p.page + 1 }))
                  }
                  className={
                    activePagination.page >= totalPages ? 'pointer-events-none opacity-40' : ''
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </PageShell>
  );
};

export default TripManagementPage;
