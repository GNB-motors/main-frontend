import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Briefcase, MessageSquare, ShieldCheck, Truck, UserCheck } from 'lucide-react';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext';
import { useFullPageLayout } from '../../hooks/usePageLayout';
import { getUserRole } from '../../utils/session';
import ReceiptApprovalPage from '../Superadmin/components/ReceiptApprovalPage';
import { FieldAgentFuelService } from '../FieldAgentFuel/FieldAgentFuelService';
import FieldAgentApprovals from './FieldAgentApprovals';
import OfficeBillApprovals from './OfficeBillApprovals';
import TripApprovals from './TripApprovals';
import billPhotoService from '../../services/billPhotoService';
import { ApprovalsService } from './ApprovalsService';
import '../Superadmin/components/ReceiptApproval.css';
import './Approvals.css';

/**
 * Every kind of approval waiting on an owner/manager. Each type is one tab with its
 * pending count; a new kind of approval is one more entry here.
 */
const APPROVAL_TYPES = [
  {
    key: 'whatsapp',
    label: 'WhatsApp',
    hint: 'Fuel bills drivers send on WhatsApp',
    icon: MessageSquare,
    pendingCount: (opts) => ApprovalsService.getWhatsAppPendingCount(opts),
  },
  {
    key: 'office',
    label: 'Owner & manager',
    hint: 'Fuel bills owners and managers upload',
    icon: Briefcase,
    pendingCount: async (opts) =>
      (
        await billPhotoService.listBillCaptures({
          status: 'pending',
          uploaderRole: 'OWNER,MANAGER',
          source: 'office',
          page: 1,
          limit: 1,
          ...opts,
        })
      ).total,
  },
  {
    key: 'field-agent',
    label: 'Field agent',
    hint: 'Fuel bills field agents upload',
    icon: UserCheck,
    flag: 'fuelIntegrity',
    pendingCount: async (opts) => (await FieldAgentFuelService.approvalCounts(opts)).PENDING ?? 0,
  },
  {
    key: 'trips',
    label: 'Trip approvals',
    hint: 'Authorised vehicle and driver visits',
    icon: Truck,
    flag: 'autoTrips',
  },
];

export default function ApprovalsPage() {
  useFullPageLayout();
  const { isEnabled } = useFeatureFlags();
  const role = getUserRole();
  const types = useMemo(
    () =>
      APPROVAL_TYPES.filter(
        (t) =>
          (!t.flag || isEnabled(t.flag)) &&
          (t.key !== 'trips' || ['OWNER', 'MANAGER'].includes(role)),
      ),
    [isEnabled, role],
  );
  const [params, setParams] = useSearchParams();
  const [pending, setPending] = useState({});
  const [officeUnavailable, setOfficeUnavailable] = useState(false);
  const visibleTypes = types.filter((t) => t.key !== 'office' || !officeUnavailable);
  const active = visibleTypes.find((t) => t.key === params.get('type')) || visibleTypes[0];

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    types.forEach((t) => {
      if (!t.pendingCount) return;
      t.pendingCount({ signal: controller.signal })
        .then((n) => alive && setPending((p) => ({ ...p, [t.key]: n })))
        .catch((error) => {
          if (!alive) return;
          if (t.key === 'office' && (error?.status ?? error?.response?.status) === 404)
            setOfficeUnavailable(true);
          else setPending((p) => ({ ...p, [t.key]: null }));
        });
    });
    return () => {
      alive = false;
      controller.abort();
    };
  }, [types]);

  const onWhatsAppCounts = useCallback(
    (counts) => setPending((p) => ({ ...p, whatsapp: counts?.READY ?? p.whatsapp })),
    [],
  );
  const onFieldAgentCounts = useCallback(
    (counts) => setPending((p) => ({ ...p, 'field-agent': counts?.PENDING ?? p['field-agent'] })),
    [],
  );

  const onOfficeCount = useCallback((count) => setPending((p) => ({ ...p, office: count })), []);
  const hideOffice = useCallback(() => setOfficeUnavailable(true), []);
  return (
    <div className="ra-page apv-page">
      <div className="ra-header">
        <div className="ra-header__bar">
          <div className="ra-header__icon">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="ra-header__title">Approvals</h1>
            <p className="ra-header__subtitle">
              Everything waiting for your approval, in one place.
            </p>
          </div>
        </div>
      </div>

      <div className="apv-types" role="tablist" aria-label="Approval type">
        {visibleTypes.map((t) => {
          const Icon = t.icon;
          const n = pending[t.key];
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active?.key === t.key}
              className={`apv-type ${active?.key === t.key ? 'is-active' : ''}`}
              onClick={() => setParams({ type: t.key }, { replace: true })}
              title={t.hint}
            >
              <Icon size={16} />
              {t.label}
              {t.pendingCount && n === undefined ? (
                <span aria-hidden="true" className="ra-skel ra-skel--round apv-type__count-skel" />
              ) : n ? (
                <span className="apv-type__count">{n}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {active?.key === 'whatsapp' ? (
        <ReceiptApprovalPage embedded onCounts={onWhatsAppCounts} />
      ) : null}
      {active?.key === 'field-agent' ? <FieldAgentApprovals onCounts={onFieldAgentCounts} /> : null}
      {active?.key === 'trips' ? <TripApprovals /> : null}
      {active?.key === 'office' ? (
        <OfficeBillApprovals onCount={onOfficeCount} onUnavailable={hideOffice} />
      ) : null}
    </div>
  );
}
