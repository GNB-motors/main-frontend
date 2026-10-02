import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import NewButton from '@/components/ui/NewButton';
import PageShell from '../../components/ui/PageShell';
import BulkUploadDriversContent from './BulkUploadDriversContent.jsx';

const BulkUploadDriversPage = () => {
  const navigate = useNavigate();

  return (
    <PageShell
      title="Bulk Upload Employees"
      subtitle="Upload employee data via .xlsx or .csv file. Map columns and preview before submitting."
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
      <BulkUploadDriversContent onCompleted={() => navigate('/drivers')} />
    </PageShell>
  );
};

export default BulkUploadDriversPage;
