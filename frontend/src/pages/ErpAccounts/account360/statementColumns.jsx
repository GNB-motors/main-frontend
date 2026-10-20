import React from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../../../components/Erp/StatusBadge';
import { documentPathFor } from '../documentRoutes';
import { inr, drCr } from '../../../utils/formatMoney';
import { formatDateIST } from '../../../utils/dateUtils';

export function buildStatementColumns() {
  return [
    {
      header: 'Date',
      cellStyle: { whiteSpace: 'nowrap' },
      render: (e) => formatDateIST(e.entryDate),
    },
    {
      header: 'Source',
      render: (e) => {
        const to = documentPathFor(e.sourceType, e.sourceId, { tripId: e.tripId });
        return (
          <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <StatusBadge status={e.sourceType} />
            {e.sourceLabel &&
              (to ? (
                <Link to={to}>{e.sourceLabel}</Link>
              ) : (
                <span className="erp-muted">{e.sourceLabel}</span>
              ))}
            {e.reversedByEntryId && <StatusBadge status="REVERSED" />}
          </span>
        );
      },
    },
    {
      header: 'Narration',
      render: (e) => (
        <span
          style={
            e.reversedByEntryId ? { textDecoration: 'line-through', color: '#94a3b8' } : undefined
          }
        >
          {e.narration || '—'}
        </span>
      ),
    },
    {
      header: 'Debit',
      headerStyle: { textAlign: 'right' },
      cellStyle: { textAlign: 'right' },
      render: (e) =>
        e.debit ? (
          <span className="erp-numeric">{inr(e.debit)}</span>
        ) : (
          <span className="erp-muted">—</span>
        ),
    },
    {
      header: 'Credit',
      headerStyle: { textAlign: 'right' },
      cellStyle: { textAlign: 'right' },
      render: (e) =>
        e.credit ? (
          <span className="erp-numeric">{inr(e.credit)}</span>
        ) : (
          <span className="erp-muted">—</span>
        ),
    },
    {
      header: 'Balance',
      headerStyle: { textAlign: 'right' },
      cellStyle: { textAlign: 'right' },
      render: (e) => <span className="erp-numeric">{drCr(e.runningBalance).text}</span>,
    },
  ];
}
