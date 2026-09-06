import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageShell from '../../components/Erp/PageShell';
import SaleBillsPage from '../ErpSaleBills/SaleBillsPage';
import OutstandingPage from '../ErpOutstanding/OutstandingPage';
import ReceiptsPage from '../ErpReceipts/ReceiptsPage';

const ErpBillingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('bills');

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab }, { replace: true });
  };

  return (
    <PageShell
      title="Billing & Receivables"
      subtitle="Manage Sale Bills, Customer Outstanding, and Payment Receipts"
      breadcrumbs={[{ label: 'ERP', to: '/erp' }, { label: 'Billing' }]}
    >
      <div className="erp-toolbar" style={{ marginTop: 0, marginBottom: '20px' }}>
        <div className="erp-tabs" style={{ margin: 0 }}>
          <button
            className={`erp-tab ${activeTab === 'bills' ? 'active' : ''}`}
            onClick={() => handleTabChange('bills')}
          >
            Sale Bills
          </button>
          <button
            className={`erp-tab ${activeTab === 'outstanding' ? 'active' : ''}`}
            onClick={() => handleTabChange('outstanding')}
          >
            Party Outstanding
          </button>
          <button
            className={`erp-tab ${activeTab === 'receipts' ? 'active' : ''}`}
            onClick={() => handleTabChange('receipts')}
          >
            Receipts
          </button>
        </div>
      </div>

      <div className="erp-hub-panel">
        {activeTab === 'bills' && <SaleBillsPage embedded={true} />}
        {activeTab === 'outstanding' && <OutstandingPage embedded={true} />}
        {activeTab === 'receipts' && <ReceiptsPage embedded={true} />}
      </div>
    </PageShell>
  );
};

export default ErpBillingPage;
