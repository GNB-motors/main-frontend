import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/Erp/PageHeader';
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
    <div className="erp-page">
      <PageHeader
        title="Payables & Outgoing Payments"
        subtitle="Manage Vendor Payments, Supplier Payments, and Purchase Bills"
        breadcrumbs={[{ label: 'ERP', to: '/erp' }, { label: 'Payables' }]}
      />

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

      <div style={{ background: '#fff', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {activeTab === 'vendor' && <VendorPaymentsPage embedded={true} />}
        {activeTab === 'supplier' && <SupplierPaymentsPage embedded={true} />}
        {activeTab === 'purchaseBills' && <UnloadingPage initialTab="bills" embedded={true} />}
      </div>
    </div>
  );
};

export default ErpPayablesPage;
