import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageShell from '../../components/Erp/PageShell';
import VendorPaymentsPage from '../ErpVendorPayments/VendorPaymentsPage';
import SupplierPaymentsPage from '../ErpSupplierPayments/SupplierPaymentsPage';
import UnloadingPage from '../ErpUnloading/UnloadingPage';

const ErpPayablesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('vendor');

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
      title="Payables & Outgoing Payments"
      subtitle="Manage Vendor Payments, Supplier Payments, and Purchase Bills"
      breadcrumbs={[{ label: 'ERP', to: '/erp' }, { label: 'Payables' }]}
    >
      <div className="erp-toolbar" style={{ marginTop: 0, marginBottom: '20px' }}>
        <div className="erp-tabs" style={{ margin: 0 }}>
          <button
            className={`erp-tab ${activeTab === 'vendor' ? 'active' : ''}`}
            onClick={() => handleTabChange('vendor')}
          >
            Vendor Payments
          </button>
          <button
            className={`erp-tab ${activeTab === 'supplier' ? 'active' : ''}`}
            onClick={() => handleTabChange('supplier')}
          >
            Supplier Payments
          </button>
          <button
            className={`erp-tab ${activeTab === 'purchaseBills' ? 'active' : ''}`}
            onClick={() => handleTabChange('purchaseBills')}
          >
            Purchase Bills
          </button>
        </div>
      </div>

      <div className="erp-hub-panel">
        {activeTab === 'vendor' && <VendorPaymentsPage embedded={true} />}
        {activeTab === 'supplier' && <SupplierPaymentsPage embedded={true} />}
        {activeTab === 'purchaseBills' && <UnloadingPage initialTab="bills" embedded={true} />}
      </div>
    </PageShell>
  );
};

export default ErpPayablesPage;
