import { useEffect } from 'react';
import { ArrowLeft, Droplets } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import FuelLogForm from '../../components/FuelLogForm/FuelLogForm';
import PageShell from '../../components/ui/PageShell';
import './MileageTracking.css';

const MileageFuelLogPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const el = document.querySelector('.page-content');
    if (el) el.classList.add('no-padding');
    return () => {
      if (el) el.classList.remove('no-padding');
    };
  }, []);

  return (
    <div className="page-container mileage-form-page">
      <PageShell
        title="Log Fuel Entry"
        subtitle="Fill in the fuel details and upload supporting documents."
        actions={
          <>
            <button
              className="mileage-back-circle"
              onClick={() => navigate('/refuel-logs')}
              aria-label="Back to refuel logs"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="mileage-header-icon-badge">
              <Droplets size={22} strokeWidth={1.8} />
              <span>Fuel Log</span>
            </div>
          </>
        }
      >
        <FuelLogForm
          initialVehicleId={searchParams.get('vehicleId')}
          initialLitres={searchParams.get('litres')}
          initialRefuelTime={searchParams.get('refuelTime')}
          onSuccess={() => navigate('/refuel-logs')}
          onCancel={() => navigate('/refuel-logs')}
        />
      </PageShell>
    </div>
  );
};

export default MileageFuelLogPage;
