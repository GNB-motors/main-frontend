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
      title="iALERT"
      aside={
        <Link to="/ialert/vehicles" className="stx-link">
          Live vehicle status
          <ArrowRight size={14} aria-hidden="true" />
        </Link>
      }
    >
      <p className="stx-card-lead">
        {formatNum(rows.length)} {rows.length === 1 ? 'account' : 'accounts'} connected ·{' '}
        {formatNum(vehicles)} {vehicles === 1 ? 'vehicle' : 'vehicles'} syncing.{' '}
        <Link to="/settings/ialert-accounts" className="stx-link">
          Manage accounts
        </Link>
      </p>
      {needsAction ? (
        <p className="stx-callout stx-callout--warn">
          <strong>
            {needsAction} {needsAction === 1 ? 'account needs' : 'accounts need'} reconnecting.
          </strong>{' '}
          Sign in to iALERT again with the GNB extension open.
        </p>
      ) : null}
    </Card>
  );
}
