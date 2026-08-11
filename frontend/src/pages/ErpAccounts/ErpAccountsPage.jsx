import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../../components/Erp/PageHeader';
import FinancialCommandCenterPage from './FinancialCommandCenterPage';
import DayBookPage from './DayBookPage';
import RegistersPage from './RegistersPage';
import FinancePage from '../ErpFinance/FinancePage';
import '../../styles/erp.css';

/**
 * Accounts & Money hub.
 *
 * The Command Center is the default landing view rather than a fifth sidebar
 * entry: the module already had three money destinations (Billing, Payables,
 * Accounts) and no overview, which is exactly why nothing could be tracked.
 * Adding a fourth entry would have deepened the problem it was meant to solve.
 *
 * `?tab=ledger` is kept as an alias. App.jsx redirects the legacy /erp/ledger
 * route to that key, and without the alias that shim lands on a blank tab.
 */

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'daybook', label: 'Day Book' },
  { key: 'registers', label: 'Registers' },
  { key: 'finance', label: 'Fleet Finance' },
];

const ALIASES = { ledger: 'daybook' };

const ErpAccountsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const raw = searchParams.get('tab');
    if (!raw) return;
    const resolved = ALIASES[raw] || raw;
    if (TABS.some((t) => t.key === resolved)) setActiveTab(resolved);
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    // Each tab owns its own list state; carrying it across produces empty tables.
    ['sub', 'page', 'q', 'from', 'to', 'sourceType', 'accountType', 'accountId'].forEach((k) => next.delete(k));
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="erp-page">
      <PageHeader
        title="Accounts & Money"
        subtitle="Receivables and payables in one view, with every figure traceable to its document"
        breadcrumbs={[{ label: 'ERP', to: '/erp' }, { label: 'Accounts' }]}
      />

      <div className="erp-toolbar" style={{ marginTop: 0, marginBottom: '20px' }}>
        <div className="erp-tabs" style={{ margin: 0 }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`erp-tab ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => handleTabChange(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="erp-hub-panel">
        {activeTab === 'overview' && <FinancialCommandCenterPage />}
        {activeTab === 'daybook' && <DayBookPage />}
        {activeTab === 'registers' && <RegistersPage />}
        {activeTab === 'finance' && <FinancePage embedded />}
      </div>
    </div>
  );
};

export default ErpAccountsPage;
