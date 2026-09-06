import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import WeightCertificateModal from './WeightCertificateModal';
import TripReportRouteMap from './TripReportRouteMap';
import { normalizeTripReportData } from './tripReportDetailFormat';
import {
  TripOverviewCard,
  FinancialSummaryCard,
  WeightDistanceCard,
  RouteInformationCard,
} from './tripReportDetailCards';
import './TripReportDetailPage.css';

const isOnTrack = (status) => status === 'COMPLETED' || status === 'SUBMITTED';

const TripReportDetailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const trip = location.state?.trip;
  const [weightCertOpen, setWeightCertOpen] = useState(false);

  if (!trip) {
    return (
      <div className="trip-report-detail">
        <div className="trip-detail-empty">
          <p>Trip data not available.</p>
          <Button variant="outline" onClick={() => navigate('/reports')}>
            <ArrowLeft size={16} /> Back to Reports
          </Button>
        </div>
      </div>
    );
  }

  const fields = normalizeTripReportData(trip);

  return (
    <div className="trip-report-detail">
      {/* Back Navigation */}
      <button className="back-nav-btn" onClick={() => navigate('/reports')}>
        <ArrowLeft size={16} />
        Back to Reports
      </button>

      {/* Header */}
      <div className="trip-detail-header">
        <div className="trip-detail-header-left">
          <div>
            <h2 className="trip-detail-title">Trip Details</h2>
            <p className="trip-detail-subtitle">
              {trip.tripNumber ? `#${trip.tripNumber} • ` : ''}
              {fields.routeName}
            </p>
          </div>
        </div>
        <div className="trip-detail-header-right">
          <span
            className="trip-status-badge"
            style={{
              backgroundColor: isOnTrack(trip.status) ? '#dcfce7' : '#fef3c7',
              color: isOnTrack(trip.status) ? '#16a34a' : '#d97706',
            }}
          >
            {trip.status || 'N/A'}
          </span>
        </div>
      </div>

      {/* Main Content - Map Left, Details Right */}
      <div className="trip-detail-body">
        <TripReportRouteMap startLoc={fields.startLoc} endLoc={fields.endLoc} />

        <div className="trip-detail-info-section">
          <TripOverviewCard
            trip={trip}
            driverName={fields.driverName}
            vehicleReg={fields.vehicleReg}
            vehicleType={fields.vehicleType}
          />

          <FinancialSummaryCard
            revenue={fields.revenue}
            expense={fields.expense}
            profit={fields.profit}
            profitMargin={fields.profitMargin}
          />

          <WeightDistanceCard
            distanceKm={fields.distanceKm}
            netWeight={fields.netWeight}
            grossWeight={fields.grossWeight}
            tareWeight={fields.tareWeight}
          />

          <RouteInformationCard
            startLoc={fields.startLoc}
            endLoc={fields.endLoc}
            routeName={fields.routeName}
          />

          <Button className="weight-cert-btn" onClick={() => setWeightCertOpen(true)}>
            <FileText size={18} />
            View Weight Certificate
          </Button>
        </div>
      </div>

      {/* Weight Certificate Modal */}
      <WeightCertificateModal
        isOpen={weightCertOpen}
        onClose={() => setWeightCertOpen(false)}
        trip={trip}
      />
    </div>
  );
};

export default TripReportDetailPage;
