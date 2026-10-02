import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import NewButton from '@/components/ui/NewButton';
import PageShell from '../../components/ui/PageShell';
import BulkUploadVehiclesContent from './BulkUploadVehiclesContent.jsx';

const BulkUploadVehiclesPage = () => {
  const navigate = useNavigate();

  return (
    <PageShell
      title="Bulk Upload Vehicles"
      subtitle="Upload vehicle data via .xlsx to normalize and update the database."
      actions={
        <NewButton
          variant="link"
          size="sm"
          text="Back"
          prependIcon={<ArrowLeft size={20} />}
          prependGap={6}
          onClick={() => navigate(-1)}
        />
      }
    >
      <BulkUploadVehiclesContent onCompleted={() => navigate('/vehicles')} />
    </PageShell>
  );
};

export default BulkUploadVehiclesPage;
