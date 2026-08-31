import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/Erp/PageHeader';
import LedgerPage from '../ErpLedger/LedgerPage';
import FinancePage from '../ErpFinance/FinancePage';
import AccountsDirectoryPage from './AccountsDirectoryPage';
import DayBookPage from './DayBookPage';
import RegistersPage from './RegistersPage';
import FinancialCommandCenterPage from './FinancialCommandCenterPage';

const ErpAccountsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');

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
        title="Accounts & Financial Ledger"
        subtitle="Manage Account Ledgers, Vouchers, Fleet Expenses, and Financial Records"
        breadcrumbs={[{ label: 'ERP', to: '/erp' }, { label: 'Accounts' }]}
      />

      <div className="erp-toolbar" style={{ marginTop: 0, marginBottom: '20px' }}>
        <div className="erp-tabs" style={{ margin: 0 }}>
          <button
            className={`erp-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => handleTabChange('overview')}
          >
            Overview
          </button>
          <button
            className={`erp-tab ${activeTab === 'accounts' ? 'active' : ''}`}
            onClick={() => handleTabChange('accounts')}
          >
            Accounts
          </button>
          <button
            className={`erp-tab ${activeTab === 'daybook' ? 'active' : ''}`}
            onClick={() => handleTabChange('daybook')}
          >
            Day Book
          </button>
          <button
            className={`erp-tab ${activeTab === 'registers' ? 'active' : ''}`}
            onClick={() => handleTabChange('registers')}
          >
            Registers
          </button>
          <button
            className={`erp-tab ${activeTab === 'ledger' ? 'active' : ''}`}
            onClick={() => handleTabChange('ledger')}
          >
            General Ledger
          </button>
          <button
            className={`erp-tab ${activeTab === 'finance' ? 'active' : ''}`}
            onClick={() => handleTabChange('finance')}
          >
            Finance & Vouchers
          </button>
        </div>
      </div>

      <div className="erp-hub-panel">
        {activeTab === 'overview' && <FinancialCommandCenterPage />}
        {activeTab === 'accounts' && <AccountsDirectoryPage />}
        {activeTab === 'daybook' && <DayBookPage />}
        {activeTab === 'registers' && <RegistersPage />}
        {activeTab === 'ledger' && <LedgerPage embedded={true} />}
        {activeTab === 'finance' && <FinancePage embedded={true} />}
      </div>
    </div>
  );
};

export default ErpAccountsPage;
