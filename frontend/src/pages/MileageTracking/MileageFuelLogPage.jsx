import { useEffect } from 'react';
import { ArrowLeft, Droplets } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FuelLogForm from '../../components/FuelLogForm/FuelLogForm';
import PageShell from '../../components/ui/PageShell';
import './MileageTracking.css';

const MileageFuelLogPage = () => {
  const navigate = useNavigate();

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
            <button className="mileage-back-circle" onClick={() => navigate('/mileage-tracking')}>
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
          onSuccess={() => navigate('/mileage-tracking')}
          onCancel={() => navigate('/mileage-tracking')}
        />
      </PageShell>
    </div>
  );
};

export default MileageFuelLogPage;
