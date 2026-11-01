import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
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
        className="diesel-entry-page"
        title="Add diesel fill"
        subtitle="Record a full or partial fill to keep this vehicle’s mileage accurate."
        actions={
          <>
            <button
              className="mileage-back-circle"
              onClick={() => navigate('/mileage?tab=live')}
              aria-label="Back to diesel fills"
            >
              <ArrowLeft size={18} />
            </button>
          </>
        }
      >
        <FuelLogForm
          initialVehicleId={searchParams.get('vehicleId')}
          initialLitres={searchParams.get('litres')}
          initialRefuelTime={searchParams.get('refuelTime')}
          onSuccess={() => navigate('/mileage?tab=live')}
          onCancel={() => navigate('/mileage?tab=live')}
        />
      </PageShell>
    </div>
  );
};

export default MileageFuelLogPage;
