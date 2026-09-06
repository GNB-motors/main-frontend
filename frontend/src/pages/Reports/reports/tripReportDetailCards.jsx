import {
  Calendar,
  Truck,
  User,
  Clock,
  BadgeIndianRupee,
  Gauge,
  MapPin,
  Weight,
  Route,
  CircleDot,
} from 'lucide-react';
import { formatTripReportDate, formatTripReportCurrency } from './tripReportDetailFormat';

const isOnTrack = (status) => status === 'COMPLETED' || status === 'SUBMITTED';

export const TripOverviewCard = (props) => {
  const { trip, driverName, vehicleReg, vehicleType } = props;
  return (
    <div className="detail-card">
      <h3 className="detail-card-title">
        <Route size={18} />
        Trip Overview
      </h3>
      <div className="detail-grid">
        <div className="detail-item">
          <Calendar size={14} />
          <div>
            <span className="detail-label">Trip Date</span>
            <span className="detail-value">{formatTripReportDate(trip.tripDate)}</span>
          </div>
        </div>
        <div className="detail-item">
          <Truck size={14} />
          <div>
            <span className="detail-label">Vehicle</span>
            <span className="detail-value">{vehicleReg}</span>
            {vehicleType !== '-' && <span className="detail-sub">{vehicleType}</span>}
          </div>
        </div>
        <div className="detail-item">
          <User size={14} />
          <div>
            <span className="detail-label">Driver</span>
            <span className="detail-value">{driverName}</span>
          </div>
        </div>
        <div className="detail-item">
          <Clock size={14} />
          <div>
            <span className="detail-label">Status</span>
            <span
              className="detail-value"
              style={{ color: isOnTrack(trip.status) ? '#16a34a' : '#d97706', fontWeight: 600 }}
            >
              {trip.status || '-'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const FinancialSummaryCard = ({ revenue, expense, profit, profitMargin }) => (
  <div className="detail-card">
    <h3 className="detail-card-title">
      <BadgeIndianRupee size={18} />
      Financial Summary
    </h3>
    <div className="detail-grid">
      <div className="detail-item">
        <BadgeIndianRupee size={14} />
        <div>
          <span className="detail-label">Revenue</span>
          <span className="detail-value highlight-green">{formatTripReportCurrency(revenue)}</span>
        </div>
      </div>
      <div className="detail-item">
        <BadgeIndianRupee size={14} />
        <div>
          <span className="detail-label">Expense</span>
          <span className="detail-value highlight-red">{formatTripReportCurrency(expense)}</span>
        </div>
      </div>
      <div className="detail-item">
        <BadgeIndianRupee size={14} />
        <div>
          <span className="detail-label">Net Profit</span>
          <span className={`detail-value ${profit >= 0 ? 'highlight-green' : 'highlight-red'}`}>
            {formatTripReportCurrency(profit)}
          </span>
        </div>
      </div>
      <div className="detail-item">
        <Gauge size={14} />
        <div>
          <span className="detail-label">Profit Margin</span>
          <span
            className={`detail-value ${profitMargin >= 0 ? 'highlight-green' : 'highlight-red'}`}
          >
            {typeof profitMargin === 'number' ? `${profitMargin.toFixed(1)}%` : '-'}
          </span>
        </div>
      </div>
    </div>
  </div>
);

export const WeightDistanceCard = ({ distanceKm, netWeight, grossWeight, tareWeight }) => (
  <div className="detail-card">
    <h3 className="detail-card-title">
      <Gauge size={18} />
      Weight & Distance
    </h3>
    <div className="detail-grid">
      <div className="detail-item">
        <MapPin size={14} />
        <div>
          <span className="detail-label">Distance</span>
          <span className="detail-value highlight-blue">
            {typeof distanceKm === 'number' ? `${distanceKm.toLocaleString('en-IN')} km` : '-'}
          </span>
        </div>
      </div>
      <div className="detail-item">
        <Weight size={14} />
        <div>
          <span className="detail-label">Net Weight</span>
          <span className="detail-value">
            {typeof netWeight === 'number' ? `${netWeight.toLocaleString('en-IN')} kg` : '-'}
          </span>
        </div>
      </div>
      <div className="detail-item">
        <Weight size={14} />
        <div>
          <span className="detail-label">Gross Weight</span>
          <span className="detail-value">
            {typeof grossWeight === 'number' ? `${grossWeight.toLocaleString('en-IN')} kg` : '-'}
          </span>
        </div>
      </div>
      <div className="detail-item">
        <Weight size={14} />
        <div>
          <span className="detail-label">Tare Weight</span>
          <span className="detail-value">
            {typeof tareWeight === 'number' ? `${tareWeight.toLocaleString('en-IN')} kg` : '-'}
          </span>
        </div>
      </div>
    </div>
  </div>
);

export const RouteInformationCard = ({ startLoc, endLoc, routeName }) => (
  <div className="detail-card">
    <h3 className="detail-card-title">
      <MapPin size={18} />
      Route Information
    </h3>
    <div className="detail-grid single-col">
      <div className="detail-item">
        <CircleDot size={14} color="#16a34a" />
        <div>
          <span className="detail-label">Start Location</span>
          <span className="detail-value">{startLoc}</span>
        </div>
      </div>
      <div className="detail-item">
        <MapPin size={14} color="#dc2626" />
        <div>
          <span className="detail-label">End Location</span>
          <span className="detail-value">{endLoc}</span>
        </div>
      </div>
      <div className="detail-item">
        <Route size={14} />
        <div>
          <span className="detail-label">Route Name</span>
          <span className="detail-value">{routeName}</span>
        </div>
      </div>
    </div>
  </div>
);
