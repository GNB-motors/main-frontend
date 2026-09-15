import React from 'react';
import { useParams } from 'react-router-dom';
import LedgerDetailView from './components/LedgerDetailView';

const KhataLedgerVehicleDetailPage = () => {
  const { id } = useParams();
  return <LedgerDetailView entityType="truck" entityId={id} />;
};

export default KhataLedgerVehicleDetailPage;
