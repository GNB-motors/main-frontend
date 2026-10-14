import React from 'react';
import { AlertTriangle } from 'lucide-react';
import StatusBadge from '../../../components/Erp/StatusBadge';
import { inr } from '../../../utils/formatMoney';

function AccountHeaderCard({
  headLoading,
  bal,
  balance,
  account,
  creditLimit,
  utilisation,
  overLimit,
  overBy,
}) {
  return (
    <div className="erp-card" style={{ padding: '20px', marginBottom: 20 }}>
      <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div>
          <div className="erp-stat-label">Balance</div>
          <div
            className="erp-stat-value"
            style={{ fontSize: 30, color: bal?.tone === 'credit' ? '#15803d' : '#1a202c' }}
          >
            {headLoading ? '…' : bal ? bal.text : '—'}
          </div>
          {balance && (
            <div className="erp-stat-sub">
              Dr {inr(balance.debit)} · Cr {inr(balance.credit)}
            </div>
          )}
        </div>

        {account?.code && (
          <div>
            <div className="erp-stat-label">Code</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{account.code}</div>
          </div>
        )}

        {account?.status && (
          <div>
            <div className="erp-stat-label">Status</div>
            <StatusBadge status={account.status} />
          </div>
        )}

        {creditLimit > 0 && (
          <div style={{ minWidth: 200 }}>
            <div className="erp-stat-label">Credit limit</div>
            <div style={{ fontSize: 15, fontWeight: 600 }} className="erp-numeric">
              {inr(creditLimit)}
            </div>
            <div
              style={{
                height: 6,
                background: '#f1f5f9',
                borderRadius: 3,
                marginTop: 8,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, utilisation || 0)}%`,
                  height: '100%',
                  background: overLimit ? '#dc2626' : '#00c896',
                }}
              />
            </div>
            <div className="erp-stat-sub" style={{ marginTop: 6 }}>
              {utilisation != null ? `${utilisation.toFixed(0)}% used` : '—'}
            </div>
          </div>
        )}
      </div>

      {overLimit && (
        <div className="erp-callout danger" style={{ marginTop: 16, marginBottom: 0 }}>
          <AlertTriangle size={15} />
          <span>
            Over credit limit by <strong>{inr(overBy)}</strong>.
          </span>
        </div>
      )}
    </div>
  );
}

export default AccountHeaderCard;
