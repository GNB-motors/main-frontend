import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import '../PageStyles.css';
import './RefuelLogsPage.css';
import apiClient from '../../utils/axiosConfig';

const fetchRefuelLogs = async () => {
  try {
    const response = await apiClient.get('api/fuel-logs');
    if (response.data.status === 'success') {
      return response.data.data.map(log => ({
        id: log._id,
        date: log.refuelTime ? new Date(log.refuelTime).toISOString().split('T')[0] : null,
        time: log.refuelTime ? new Date(log.refuelTime).toTimeString().split(' ')[0] : null,
        vehicleNo: log.vehicleId?.registrationNumber || '-',
        vehicleModel: log.vehicleId?.vehicleType || '-',
        driverName: log.tripId?.driverId ? `${log.tripId.driverId.firstName} ${log.tripId.driverId.lastName}`.trim() : '-',
        driverPhone: '-', // Not available in API
        location: log.location || '-',
        vendor: '-', // Not available in API
        fuelType: log.fuelType ? log.fuelType.toLowerCase() : 'unknown',
        quantity: log.litres || '-',
        unitPrice: log.rate || null,
        totalAmount: log.totalAmount || '-',
        odometer: log.odometerReading || '-',
        paymentMethod: '-', // Not available in API
        notes: log.fillingType ? (log.fillingType === 'FULL_TANK' ? 'Full Tank' : log.fillingType) : '-',
        tripId: log.tripId,
        vehicleId: log.vehicleId,
        documentId: log.documentId,
        loggedBy: log.loggedBy,
        createdAt: log.createdAt
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching refuel logs:', error);
    return [];
  }
};

const filterTabs = [
  { id: 'all', label: 'All' },
  { id: 'diesel', label: 'Diesel' },
  { id: 'adblue', label: 'AdBlue' }
];

const formatDate = (dateStr) => {
  if (!dateStr) {
    return '-';
  }
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return dateStr;
  }
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatCurrency = (value) => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return '-';
  }
  return `₹${Number(value).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

const RefuelLogsPage = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const pageContentEl = document.querySelector('.page-content');
    if (pageContentEl) {
      pageContentEl.classList.add('no-padding');
    }

    return () => {
      if (pageContentEl) {
        pageContentEl.classList.remove('no-padding');
      }
    };
  }, []);

  useEffect(() => {
    const loadLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedLogs = await fetchRefuelLogs();
        setLogs(fetchedLogs);
      } catch (err) {
        setError('Failed to load refuel logs');
        console.error('Error loading refuel logs:', err);
      } finally {
        setLoading(false);
      }
    };

    loadLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    const searchValue = searchTerm.trim().toLowerCase();

    return logs.filter((log) => {
      const matchesTab =
        activeTab === 'all' ||
        (log.fuelType && log.fuelType.toLowerCase() === activeTab);

      if (!matchesTab) {
        return false;
      }

      if (!searchValue) {
        return true;
      }

      const haystack = [
        log.vehicleNo,
        log.vehicleModel,
        log.driverName,
        log.driverPhone,
        log.location,
        log.vendor,
        log.paymentMethod
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return haystack.includes(searchValue);
    });
  }, [activeTab, logs, searchTerm]);

  return (
    <div className="refuel-logs-page">
      <div className="refuel-logs-header">
        <div className="refuel-tabs">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`refuel-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="refuel-header-actions">
          <div className="refuel-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Search vehicle, driver, or location"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="refuel-table-container">
        <table className="refuel-table">
          <thead>
            <tr>
              <th>Date &amp; Time</th>
              <th>Vehicle</th>
              <th>Driver</th>
              <th>Location</th>
              <th>Fuel Type</th>
              <th>Quantity (L)</th>
              <th>Unit Price</th>
              <th>Total Amount</th>
              <th>Odometer</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} className="refuel-empty-state">
                  Loading refuel logs...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={10} className="refuel-empty-state">
                  {error}
                </td>
              </tr>
            ) : filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={10} className="refuel-empty-state">
                  No refuel logs found. Try adjusting your filters or add a new refuel entry.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const timestamp = log.date ? `${log.date}${log.time ? `T${log.time}` : ''}` : null;
                const formattedDate = timestamp ? formatDate(timestamp) : formatDate(log.date);

                return (
                  <tr key={log.id}>
                    <td>
                      <div className="cell-primary">{formattedDate}</div>
                      <div className="cell-secondary">{log.time || '-'}</div>
                    </td>
                    <td>
                      <div className="cell-primary">{log.vehicleNo || '-'}</div>
                      <div className="cell-secondary">{log.vehicleModel || '--'}</div>
                    </td>
                    <td>
                      <div className="cell-primary">{log.driverName || '-'}</div>
                      <div className="cell-secondary">{log.driverPhone || '--'}</div>
                    </td>
                    <td>
                      <div className="cell-primary">{log.location || '-'}</div>
                      <div className="cell-secondary">{log.vendor || '--'}</div>
                    </td>
                    <td>
                      <span className={`fuel-type-pill ${
                        log.fuelType ? log.fuelType.toLowerCase() : 'unknown'
                      }`}
                      >
                        {log.fuelType || 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <div className="cell-primary">{log.quantity || '-'}</div>
                      <div className="cell-secondary">Litres</div>
                    </td>
                    <td>{formatCurrency(log.unitPrice)}</td>
                    <td>{formatCurrency(log.totalAmount)}</td>
                    <td>
                      <div className="cell-primary">{log.odometer ? `${log.odometer} km` : '-'}</div>
                      <div className="cell-secondary">Reading</div>
                    </td>
                    <td>
                      <div className="cell-primary">{log.notes || '-'}</div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RefuelLogsPage;
