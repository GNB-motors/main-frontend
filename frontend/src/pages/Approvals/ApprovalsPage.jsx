import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MessageSquare, ShieldCheck, UserCheck } from 'lucide-react';
import apiClient from '../../utils/axiosConfig';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext';
import ReceiptApprovalPage from '../Superadmin/components/ReceiptApprovalPage';
import { FieldAgentFuelService } from '../FieldAgentFuel/FieldAgentFuelService';
import FieldAgentApprovals from './FieldAgentApprovals';
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
    pendingCount: async () => {
      const res = await apiClient.get('/api/whatsapp/admin/drafts/counts');
      return res.data?.data?.READY ?? 0;
    },
  },
  {
    key: 'field-agent',
    label: 'Field agent',
    hint: 'Fuel bills field agents upload',
    icon: UserCheck,
    flag: 'fuelIntegrity',
    pendingCount: async () => (await FieldAgentFuelService.approvalCounts()).PENDING ?? 0,
  },
];

export default function ApprovalsPage() {
  const { isEnabled } = useFeatureFlags();
  const types = useMemo(
    () => APPROVAL_TYPES.filter((t) => !t.flag || isEnabled(t.flag)),
    [isEnabled],
  );
  const [params, setParams] = useSearchParams();
  const active = types.find((t) => t.key === params.get('type')) || types[0];
  const [pending, setPending] = useState({});

  useEffect(() => {
    let alive = true;
    types.forEach((t) => {
      t.pendingCount()
        .then((n) => alive && setPending((p) => ({ ...p, [t.key]: n })))
        .catch(() => alive && setPending((p) => ({ ...p, [t.key]: null })));
    });
    return () => {
      alive = false;
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

  return (
    <div className="ra-page">
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
        {types.map((t) => {
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
              {n === undefined ? (
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
    </div>
  );
}
