import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Search, ChevronRight } from 'lucide-react';
import '../PageStyles.css';
import './TripManagementPage.css';
import { TripService, WeightSlipTripService } from './services';
import { getVehicleRegistration, getDriverName } from '../../utils/dataFormatters';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const PAGE_SIZE = 10;

const TripManagementPage = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('trips');
  const [searchQuery, setSearchQuery] = useState('');

  const [weightSlipTrips, setWeightSlipTrips] = useState([]);
  const [loadingWeightSlipTrips, setLoadingWeightSlipTrips] = useState(false);
  const [weightSlipPagination, setWeightSlipPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0 });

  const [refuelTrips, setRefuelTrips] = useState([]);
  const [loadingRefuelTrips, setLoadingRefuelTrips] = useState(false);
  const [refuelPagination, setRefuelPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0 });

  useEffect(() => {
    const el = document.querySelector('.page-content');
    if (el) el.classList.add('no-padding');
    return () => { if (el) el.classList.remove('no-padding'); };
  }, []);

  const fetchWeightSlipTrips = async () => {
    setLoadingWeightSlipTrips(true);
    try {
      const res = await WeightSlipTripService.getAll({ page: weightSlipPagination.page, limit: weightSlipPagination.limit });
      setWeightSlipTrips(res.data || []);
      // Handle various pagination formats from different backend versions
      const total = res.pagination?.total ?? res.total ?? res.totalResults ?? res.meta?.total ?? 0;
      setWeightSlipPagination(p => ({ ...p, total }));
    } catch { toast.error('Failed to load trips'); }
    finally { setLoadingWeightSlipTrips(false); }
  };

  const fetchRefuelTrips = async () => {
    setLoadingRefuelTrips(true);
    try {
      const res = await TripService.getAllTrips({ page: refuelPagination.page, limit: refuelPagination.limit });
      setRefuelTrips(res.data || []);
      const total = res.pagination?.total ?? res.total ?? res.totalResults ?? res.meta?.total ?? 0;
      setRefuelPagination(p => ({ ...p, total }));
    } catch { toast.error('Failed to load refuel journeys'); }
    finally { setLoadingRefuelTrips(false); }
  };

  useEffect(() => {
    setActivePagination(p => ({ ...p, page: 1 }));
    if (activeTab === 'trips') fetchWeightSlipTrips();
    else fetchRefuelTrips();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'trips') fetchWeightSlipTrips();
    else fetchRefuelTrips();
  }, [weightSlipPagination.page, refuelPagination.page]);

  useEffect(() => {
    const h = () => navigate('/trip/new');
    window.addEventListener('startNewTrip', h);
    return () => window.removeEventListener('startNewTrip', h);
  }, [navigate]);

  const filterTrips = (trips) => {
    if (!searchQuery) return trips;
    const q = searchQuery.toLowerCase();
    return trips.filter(trip => {
      if (activeTab === 'trips') {
        const reg = (trip.journeyId?.vehicleId?.registrationNumber || trip.vehicleId?.registrationNumber || trip.vehicleId || '').toString().toLowerCase();
        const driver = trip.journeyId?.driverId
          ? `${trip.journeyId.driverId.firstName} ${trip.journeyId.driverId.lastName}`.toLowerCase()
          : trip.driverId ? `${trip.driverId.firstName || ''} ${trip.driverId.lastName || ''}`.toLowerCase() : '';
        return reg.includes(q) || driver.includes(q) ||
          trip.routeData?.name?.toLowerCase().includes(q) ||
          trip.routeData?.sourceLocation?.city?.toLowerCase().includes(q) ||
          trip.routeData?.destLocation?.city?.toLowerCase().includes(q) ||
          trip.materialType?.toLowerCase().includes(q) || trip._id.includes(q);
      } else {
        const driver = trip.driverId ? `${trip.driverId.firstName} ${trip.driverId.lastName}`.toLowerCase() : '';
        return trip.vehicleId?.registrationNumber?.toLowerCase().includes(q) || driver.includes(q) || trip._id.includes(q);
      }
    });
  };

  const activePagination = activeTab === 'trips' ? weightSlipPagination : refuelPagination;
  const setActivePagination = activeTab === 'trips' ? setWeightSlipPagination : setRefuelPagination;
  const isLoading = activeTab === 'trips' ? loadingWeightSlipTrips : loadingRefuelTrips;
  const filteredTrips = filterTrips(activeTab === 'trips' ? weightSlipTrips : refuelTrips);
  const totalPages = Math.ceil(activePagination.total / activePagination.limit) || 1;

  const getStatusColor = (status) => {
    const c = { SUBMITTED: '#4caf50', COMPLETED: '#4caf50', DRIVER_SELECTED: '#2196f3', DOCUMENTS_UPLOADED: '#2196f3', OCR_VERIFIED: '#2196f3', ROUTES_ASSIGNED: '#2196f3', REVENUE_ENTERED: '#ff9800', EXPENSES_ENTERED: '#ff9800', ONGOING: '#ff9800', PLANNED: '#2196f3', CANCELLED: '#f44336' };
    return c[status] || '#757575';
  };

  const formatDate = (d) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const renderPageItems = () => {
    const items = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - activePagination.page) <= 1) {
        items.push(i);
      } else if (items[items.length - 1] !== '...') {
        items.push('...');
      }
    }
    return items;
  };

  return (
    <div className="page-container trip-management-container">
      {/* Header */}
      <div className="trip-management-header">
        <div className="header-content">
          <div className="tabs-container">
            <button className={`tab-btn ${activeTab === 'trips' ? 'active' : ''}`} onClick={() => { setActiveTab('trips'); setSearchQuery(''); }}>
              <span className="tab-icon">📦</span>Trips
            </button>
            <button className={`tab-btn ${activeTab === 'refuel' ? 'active' : ''}`} onClick={() => { setActiveTab('refuel'); setSearchQuery(''); }}>
              <span className="tab-icon">⛽</span>Refuel Journeys
            </button>
          </div>
          <div className="search-bar">
            <Search width={18} height={18} color="#9ca3af" />
            <input
              type="text"
              placeholder={`Search ${activeTab === 'trips' ? 'trips' : 'refuel journeys'}...`}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setActivePagination(p => ({ ...p, page: 1 }));
              }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="trip-content-area">
        {isLoading ? (
          <div className="loading-state"><p>Loading {activeTab === 'trips' ? 'trips' : 'refuel journeys'}...</p></div>
        ) : filteredTrips.length === 0 ? (
          <div className="empty-state">
            <p>No {activeTab === 'trips' ? 'trips' : 'refuel journeys'} found</p>
            {searchQuery && <p className="empty-subtext">Try adjusting your search</p>}
          </div>
        ) : (
          <div className="table-wrapper">
            <Table>
              <TableHeader>
                <TableRow className="table-header-row">
                  {activeTab === 'trips' ? (
                    <>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Material</TableHead>
                      <TableHead>Net Weight</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Trips Count</TableHead>
                      <TableHead>Total Fuel</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeTab === 'trips'
                  ? filteredTrips.map((trip) => (
                    <TableRow key={trip._id} className="trip-table-row" onClick={() => navigate(`/trip-management/weight-slip/${trip._id}`)}>
                      <TableCell className="font-semibold text-gray-900">{getVehicleRegistration(trip.journeyId?.vehicleId || trip.vehicleId) || '-'}</TableCell>
                      <TableCell>{getDriverName(trip.journeyId?.driverId || trip.driverId) || '-'}</TableCell>
                      <TableCell>
                        {trip.routeData?.name ||
                          (trip.routeData?.sourceLocation?.city && trip.routeData?.destLocation?.city
                            ? `${trip.routeData.sourceLocation.city} → ${trip.routeData.destLocation.city}` : '-')}
                      </TableCell>
                      <TableCell>{trip.materialType || '-'}</TableCell>
                      <TableCell>{trip.weights?.netWeight ? `${trip.weights.netWeight} kg` : '-'}</TableCell>
                      <TableCell>
                        <span className="status-badge" style={{ backgroundColor: getStatusColor(trip.status) + '22', color: getStatusColor(trip.status) }}>
                          {trip.status}
                        </span>
                      </TableCell>
                      <TableCell className="last-col">
                        <span className="date-text">{formatDate(trip.createdAt)}</span>
                        <button className="view-details-btn">
                          View details
                          <ChevronRight size={14} />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                  : filteredTrips.map((trip) => (
                    <TableRow key={trip._id} className="trip-table-row" onClick={() => navigate(`/trip-management/trip/${trip._id}`)}>
                      <TableCell className="font-semibold text-gray-900">{getVehicleRegistration(trip.journeyId?.vehicleId || trip.vehicleId) || '-'}</TableCell>
                      <TableCell>{trip.driverId?.firstName && trip.driverId?.lastName ? `${trip.driverId.firstName} ${trip.driverId.lastName}` : '-'}</TableCell>
                      <TableCell>{trip.journeyFinancials?.totalTrips || trip.weightSlipTrips?.length || 0}</TableCell>
                      <TableCell>{trip.fuelManagement?.totalLiters ? `${trip.fuelManagement.totalLiters.toFixed(2)} L` : '-'}</TableCell>
                      <TableCell>{trip.journeyFinancials?.totalRevenue ? `₹${trip.journeyFinancials.totalRevenue.toFixed(2)}` : '-'}</TableCell>
                      <TableCell>
                        <span className="status-badge" style={{ backgroundColor: getStatusColor(trip.status) + '22', color: getStatusColor(trip.status) }}>
                          {trip.status}
                        </span>
                      </TableCell>
                      <TableCell className="last-col">
                        <span className="date-text">{formatDate(trip.createdAt)}</span>
                        <button className="view-details-btn">
                          View details
                          <ChevronRight size={14} />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                }
              </TableBody>
            </Table>
          </div>
        )}

        {/* Shadcn Pagination - Standard layout */}
        {!isLoading && filteredTrips.length > 0 && totalPages > 1 && (
          <div className="pagination-wrapper">
            <Pagination className="justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => activePagination.page > 1 && setActivePagination(p => ({ ...p, page: p.page - 1 }))}
                    className={activePagination.page <= 1 ? 'pointer-events-none opacity-40' : ''}
                  />
                </PaginationItem>

                {renderPageItems().map((item, idx) =>
                  item === '...' ? (
                    <PaginationItem key={`e-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={item}>
                      <PaginationLink
                        isActive={activePagination.page === item}
                        onClick={() => setActivePagination(p => ({ ...p, page: item }))}
                      >
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}

                <PaginationItem>
                  <PaginationNext
                    onClick={() => activePagination.page < totalPages && setActivePagination(p => ({ ...p, page: p.page + 1 }))}
                    className={activePagination.page >= totalPages ? 'pointer-events-none opacity-40' : ''}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripManagementPage;
