import React, { useEffect } from 'react';
import { ArrowLeft, Droplets } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import FuelLogForm from '../../components/FuelLogForm/FuelLogForm';
import './MileageTracking.css';

const MileageFuelLogPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const el = document.querySelector('.page-content');
    if (el) el.classList.add('no-padding');
    return () => { if (el) el.classList.remove('no-padding'); };
  }, []);

  return (
    <div className="page-container mileage-form-page">
      <div className="mileage-form-header">
        <div className="mileage-header-left">
          <button className="mileage-back-circle" onClick={() => navigate('/mileage-tracking')}>
            <ArrowLeft size={18} />
          </button>
          <div className="mileage-header-titles">
            <h2>Log Fuel Entry</h2>
            <p>Fill in the fuel details and upload supporting documents.</p>
          </div>
        </div>
        <div className="mileage-header-icon-badge">
          <Droplets size={22} strokeWidth={1.8} />
          <span>Fuel Log</span>
        </div>
      </div>

      <FuelLogForm
        onSuccess={() => navigate('/mileage-tracking')}
        onCancel={() => navigate('/mileage-tracking')}
      />
    </div>
  );
};

export default MileageFuelLogPage;
