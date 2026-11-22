import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Download } from 'lucide-react';
import PageShell from '../../components/Erp/PageShell';
import ErrorCard from '../../components/redesign/ErrorCard';
import Num from '../../components/ui/Num';
import logger from '../../utils/logger';
import ErpTable from '../../components/Erp/ErpTable';
import DateRangeFilter from '../../components/Erp/DateRangeFilter';
import useErpList from '../../hooks/useErpList';
import LedgerApi from '../ErpLedger/LedgerService';
import OutstandingApi from '../ErpOutstanding/OutstandingService';
import VendorPaymentApi from '../ErpVendorPayments/VendorPaymentService';
import { SupplierPaymentApi } from '../ErpSupplierPayments/SupplierPaymentService';
import { getEntityById } from '../../components/Erp/entityLookup.service';
import { inr, num, drCr } from '../../utils/formatMoney';
import { creditUsage, openItemsTotal } from './account360Logic';
import { buildStatementColumns } from './account360/statementColumns';
import { buildOpenItemColumns } from './account360/openItemColumns';
import AccountHeaderCard from './account360/AccountHeaderCard';
import '../../styles/erp.css';

/**
 * Account 360 — everything about one party, vendor, supplier or driver.
 *
 * This is the central "keep track" object. It also fixes a real gap: the old
 * LedgerPage hardcoded accountType:'PARTY', so vendor, supplier and driver
 * ledgers were unreachable from the UI even though the API always supported
 * them. Here the type comes from the URL.
 *
 * Balances are shown as Dr/Cr, never as a signed number — "-₹50,000" is
 * ambiguous about who owes whom, "₹50,000 Cr" is not.
 */

const VALID_TYPES = ['party', 'vendor', 'supplier', 'driver'];

const TABS = [
  { key: 'statement', label: 'Statement' },
  { key: 'open', label: 'Open items' },
];

const Account360Page = () => {
  const { accountType: rawType, accountId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const accountType = String(rawType || '').toUpperCase();
  const isValid = VALID_TYPES.includes(String(rawType || '').toLowerCase());

  const [tab, setTab] = useState(() => searchParams.get('tab') || 'statement');

  // The master record and the balance are two independent reads. Each keeps its
  // own failure, and each result is stamped with the identity it belongs to, so
  // the previous account can never be shown under a new one.
  const identityKey = `${accountType}:${accountId || ''}`;
  const [accountRead, setAccountRead] = useState({
    key: null,
    entity: null,
    error: null,
    loading: false,
  });
  const [balanceRead, setBalanceRead] = useState({
    key: null,
    value: null,
    error: null,
    loading: false,
  });
  const [accountToken, setAccountToken] = useState(0);
  const [balanceToken, setBalanceToken] = useState(0);
  const [exportError, setExportError] = useState(null);

  const account = accountRead.key === identityKey ? accountRead.entity : null;
  const accountError = accountRead.key === identityKey ? accountRead.error : null;
  const accountLoading = accountRead.key !== identityKey || accountRead.loading;
  const balance = balanceRead.key === identityKey ? balanceRead.value : null;
  const balanceError = balanceRead.key === identityKey ? balanceRead.error : null;
  const balanceLoading = balanceRead.key !== identityKey || balanceRead.loading;
  const headLoading = accountLoading || balanceLoading;

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && TABS.some((x) => x.key === t)) setTab(t);
  }, [searchParams]);

  const selectTab = (key) => {
    setTab(key);
    const next = new URLSearchParams(searchParams);
    next.set('tab', key);
    ['page', 'q', 'from', 'to'].forEach((k) => next.delete(k));
    setSearchParams(next, { replace: true });
  };

  // Header: the master record on its own. A failure here is shown and can be
  // retried — it never leaves a blank header with no explanation.
  useEffect(() => {
    if (!isValid) return undefined;
    let active = true;
    setAccountRead({ key: identityKey, entity: null, error: null, loading: true });
    getEntityById(accountType, accountId, { throwOnError: true })
      .then((entity) => {
        if (!active) return;
        setAccountRead({ key: identityKey, entity: entity || null, error: null, loading: false });
      })
      .catch((err) => {
        if (!active) return;
        logger.error('erp-account360', 'account lookup failed', {
          status: err?.status ?? err?.response?.status ?? null,
          message: err?.message ?? String(err),
          accountType,
          accountId,
        });
        setAccountRead({ key: identityKey, entity: null, error: err, loading: false });
      });
    return () => {
      active = false;
    };
  }, [accountType, accountId, isValid, identityKey, accountToken]);

  // Header: the aggregate balance on its own. It can fail without taking the
  // master record down with it.
  useEffect(() => {
    if (!isValid) return undefined;
    let active = true;
    setBalanceRead({ key: identityKey, value: null, error: null, loading: true });
    LedgerApi.getBalance({ accountType, accountId })
      .then((res) => {
        if (!active) return;
        setBalanceRead({
          key: identityKey,
          value: res?.data || null,
          error: null,
          loading: false,
        });
      })
      .catch((err) => {
        if (!active) return;
        logger.error('erp-account360', 'balance request failed', {
          status: err?.status ?? err?.response?.status ?? null,
          message: err?.message ?? String(err),
          accountType,
          accountId,
        });
        setBalanceRead({ key: identityKey, value: null, error: err, loading: false });
      });
    return () => {
      active = false;
    };
  }, [accountType, accountId, isValid, identityKey, balanceToken]);

  /* ── Statement tab ─────────────────────────────────────────────────────── */
  const statementFetcher = useCallback(
    (params) => LedgerApi.getStatement({ ...params, accountType, accountId }),
    [accountType, accountId],
  );

  const statement = useErpList(statementFetcher, {
    initial: { page: 1, limit: 25, from: '', to: '' },
    syncToUrl: true,
    deps: [accountType, accountId],
  });

  /* ── Open items tab ────────────────────────────────────────────────────── */
  const openFetcher = useCallback(
    async (params) => {
      if (accountType === 'PARTY') {
        return OutstandingApi.list({ ...params, partyId: accountId, view: 'ALL' });
      }
      if (accountType === 'VENDOR') {
        const res = await VendorPaymentApi.getOutstanding({
          vendorId: accountId,
          includeBills: true,
        });
        return { data: res.data?.[0]?.bills || [], meta: null };
      }
      if (accountType === 'SUPPLIER') {
        const res = await SupplierPaymentApi.getOutstanding({
          supplierId: accountId,
          includeInvoices: true,
        });
        return { data: res.data?.[0]?.invoices || [], meta: null };
      }
      // Drivers have no open-item document type — shortages post straight to the ledger.
      return { data: [], meta: null };
    },
    [accountType, accountId],
  );

  const openItems = useErpList(openFetcher, {
    initial: { page: 1, limit: 25 },
    syncToUrl: false,
    deps: [accountType, accountId],
  });

  const bal = balance ? drCr(balance.balance) : null;
  const creditLimit = account?.creditLimit ?? 0;
  const { utilisation, overLimit, overBy } = creditUsage(creditLimit, balance?.balance);

  const statementColumns = useMemo(() => buildStatementColumns(), []);

  const openColumns = useMemo(() => buildOpenItemColumns(accountType), [accountType]);

  const openTotal = useMemo(() => openItemsTotal(openItems.rows), [openItems.rows]);

  const exportStatement = async () => {
    setExportError(null);
    try {
      const blob = await LedgerApi.exportStatementCsv({
        accountType,
        accountId,
        ...(statement.params.from ? { from: statement.params.from } : {}),
        ...(statement.params.to ? { to: statement.params.to } : {}),
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `statement-${accountType}-${account?.code || accountId}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      logger.error('erp-account360', 'statement export failed', {
        status: err?.status ?? err?.response?.status ?? null,
        message: err?.message ?? String(err),
        accountType,
        accountId,
      });
      setExportError(err);
    }
  };

  if (!isValid) {
    return (
      <div className="erp-page">
        <p className="erp-muted">
          Unknown account type “{rawType}”. Expected one of: {VALID_TYPES.join(', ')}.
        </p>
        <Link to="/erp/accounts" className="erp-link-btn">
          ← Back to Accounts
        </Link>
      </div>
    );
  }

  const statementTotals = statement.raw || null;
  // A total the server did not send is unknown, not zero rupees.
  const opening = statementTotals?.openingBalance ?? null;
  const periodDebit = statementTotals?.totals?.debit ?? null;
  const periodCredit = statementTotals?.totals?.credit ?? null;
  const closing = statementTotals?.closingBalance ?? null;
  const openUnknown = Boolean(openItems.error);

  return (
    <PageShell
      title={headLoading ? 'Loading…' : account?.name || 'Account'}
      subtitle={`${accountType} account`}
      breadcrumbs={[
        { label: 'ERP', to: '/erp' },
        { label: 'Accounts', to: '/erp/accounts' },
        { label: account?.name || accountType },
      ]}
      actions={
        <>
          <Link to="/erp/accounts" className="erp-btn">
            <ArrowLeft size={15} /> Accounts
          </Link>
          <button type="button" className="erp-btn" onClick={exportStatement}>
            <Download size={15} /> Statement CSV
          </button>
        </>
      }
    >
      {/* ── Header failures: one card each, one retry each ────────────── */}
      {exportError ? (
        <div style={{ marginBottom: 16 }}>
          <ErrorCard
            error={exportError}
            onRetry={exportStatement}
            title="We couldn't download the statement."
          />
        </div>
      ) : null}

      {accountError ? (
        <div style={{ marginBottom: 16 }}>
          <ErrorCard
            error={accountError}
            onRetry={() => setAccountToken((t) => t + 1)}
            title="We couldn't load this account."
          />
        </div>
      ) : null}

      {balanceError ? (
        <div style={{ marginBottom: 16 }}>
          <ErrorCard
            error={balanceError}
            onRetry={() => setBalanceToken((t) => t + 1)}
            title="We couldn't load the balance for this account."
          />
        </div>
      ) : null}

      {/* Header card — balance as Dr/Cr, credit exposure. */}
      <AccountHeaderCard
        headLoading={headLoading}
        bal={bal}
        balance={balance}
        account={account}
        creditLimit={creditLimit}
        utilisation={utilisation}
        overLimit={overLimit}
        overBy={overBy}
        balanceNote={balanceError ? 'Balance not loaded' : null}
      />

      <div className="erp-tabs" style={{ marginBottom: 16 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`erp-tab ${tab === t.key ? 'active' : ''}`}
            onClick={() => selectTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'statement' && (
        <>
          <div
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
              flexWrap: 'wrap',
              marginBottom: 14,
            }}
          >
            <DateRangeFilter
              value={{ from: statement.params.from, to: statement.params.to }}
              onChange={(r) => statement.setParams({ from: r.from, to: r.to })}
            />
          </div>

          {statement.error ? (
            <div style={{ marginBottom: 14 }}>
              <ErrorCard
                error={statement.error}
                onRetry={statement.refresh}
                title="We couldn't load the statement."
              />
            </div>
          ) : null}

          <div
            className="erp-stat-grid"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              marginBottom: 16,
            }}
          >
            <div className="erp-stat">
              <div className="erp-stat-label">Opening</div>
              <div className="erp-stat-value" style={{ fontSize: 18 }}>
                {opening != null ? (
                  drCr(opening).text
                ) : (
                  <Num value={null} reason="total unavailable" />
                )}
              </div>
            </div>
            <div className="erp-stat">
              <div className="erp-stat-label">Period debit</div>
              <div className="erp-stat-value" style={{ fontSize: 18 }}>
                {periodDebit != null ? (
                  inr(periodDebit)
                ) : (
                  <Num value={null} reason="total unavailable" />
                )}
              </div>
            </div>
            <div className="erp-stat">
              <div className="erp-stat-label">Period credit</div>
              <div className="erp-stat-value" style={{ fontSize: 18 }}>
                {periodCredit != null ? (
                  inr(periodCredit)
                ) : (
                  <Num value={null} reason="total unavailable" />
                )}
              </div>
            </div>
            <div className="erp-stat">
              <div className="erp-stat-label">Closing</div>
              <div className="erp-stat-value" style={{ fontSize: 18 }}>
                {closing != null ? (
                  drCr(closing).text
                ) : (
                  <Num value={null} reason="total unavailable" />
                )}
              </div>
            </div>
          </div>

          <ErpTable
            columns={statementColumns}
            data={statement.rows}
            loading={statement.loading}
            pagination={statement.pagination}
            emptyText="No ledger entries for this account in the selected period"
          />
        </>
      )}

      {tab === 'open' && (
        <>
          {accountType === 'DRIVER' ? (
            <p className="erp-muted">
              Driver accounts have no open documents — shortages and advances post directly to the
              ledger. See the Statement tab.
            </p>
          ) : (
            <>
              {openItems.error ? (
                <div style={{ marginBottom: 14 }}>
                  <ErrorCard
                    error={openItems.error}
                    onRetry={openItems.refresh}
                    title="We couldn't load the open items."
                  />
                </div>
              ) : null}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: 12,
                  flexWrap: 'wrap',
                  gap: 12,
                }}
              >
                <span className="erp-muted">
                  {openUnknown ? '—' : num(openItems.rows.length)} open{' '}
                  {accountType === 'SUPPLIER' ? 'invoices' : 'bills'}
                </span>
                <span style={{ fontSize: 15 }}>
                  Total{' '}
                  <strong className="erp-numeric">
                    {openUnknown ? <Num value={null} reason="total unavailable" /> : inr(openTotal)}
                  </strong>
                </span>
              </div>

              <ErpTable
                columns={openColumns}
                data={openItems.rows}
                loading={openItems.loading}
                pagination={openItems.pagination}
                emptyText="Nothing outstanding on this account"
              />
            </>
          )}
        </>
      )}
    </PageShell>
  );
};

export default Account360Page;
