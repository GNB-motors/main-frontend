import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import useApi from '../../hooks/useApi';
import { formatNum } from '../../utils/formatters';
import { Card } from './settingsAtoms';
import { connectionBadge } from './ialertAccountsModel.js';
import { fetchIalertStatus } from './ialertStatusApi.js';

/**
 * Settings → Fleet data: the iALERT summary card. Hidden until this user has
 * linked at least one iALERT account (F1 §4.5 — never an empty iALERT block).
 */
export function IalertAccountsCard() {
  const { data } = useApi((signal) => fetchIalertStatus(signal), []);
  const rows = data || [];
  if (!rows.length) return null;
  const needsAction = rows.filter((r) => connectionBadge(r).tone === 'crit').length;
  const vehicles = rows.reduce((n, r) => n + (r.vehicleCount || 0), 0);
  return (
    <Card
      title="iALERT accounts"
      aside={
        <Link to="/settings/ialert-accounts" className="stx-link">
          View accounts
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      }
    >
      <p className="text-sm text-slate-600">
        {rows.length} connected · {formatNum(vehicles)} vehicles synced
        {needsAction ? (
          <span className="ml-2 font-semibold text-red-600">· {needsAction} need reconnecting</span>
        ) : null}
      </p>
    </Card>
  );
}
