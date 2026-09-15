import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageShell from '../../components/Erp/PageShell';
import LedgerPage from '../ErpLedger/LedgerPage';
import FinancePage from '../ErpFinance/FinancePage';
import AccountsDirectoryPage from './AccountsDirectoryPage';
import DayBookPage from './DayBookPage';
import RegistersPage from './RegistersPage';
import FinancialCommandCenterPage from './FinancialCommandCenterPage';

const ErpAccountsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  // Seed from the URL so a deep link (?tab=ledger) mounts that tab directly.
  // Defaulting to 'overview' first mounted the command center, whose in-flight
  // fetch was then aborted on the tab switch — surfacing a spurious "canceled" toast.
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'overview');

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
      title="Accounts & Financial Ledger"
      subtitle="Manage Account Ledgers, Vouchers, Fleet Expenses, and Financial Records"
      breadcrumbs={[{ label: 'ERP', to: '/erp' }, { label: 'Accounts' }]}
    >
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
    </PageShell>
  );
};

export default ErpAccountsPage;
