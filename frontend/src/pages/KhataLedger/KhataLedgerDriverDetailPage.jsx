import React from 'react';
import { useParams } from 'react-router-dom';
import LedgerDetailView from './components/LedgerDetailView';

const KhataLedgerDriverDetailPage = () => {
  const { id } = useParams();
  return <LedgerDetailView entityType="driver" entityId={id} />;
};

export default KhataLedgerDriverDetailPage;
