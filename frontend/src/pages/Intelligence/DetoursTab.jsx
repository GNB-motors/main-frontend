import { IntelligenceViewSwitcher, IntelligenceAuditWorkspace } from './IntelligenceWorkspace.jsx';
import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GitFork, Zap } from 'lucide-react';
import DeviationView from '../RouteHub/views/DeviationView.jsx';
import InstancesTab from './InstancesTab.jsx';
import { trackLink } from '../../utils/redesign/links.js';
import '../RouteHub/routeHubDesign.css';
import './IntelligencePage.css';

export default function DetoursTab({ from, to, vehicle = '', driver = '' }) {
  const [subView, setSubView] = useState('audit'); // 'audit' | 'instances'
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [toastMsg, setToastMsg] = useState(null);

  const deviationParams = useMemo(() => {
    const p = new URLSearchParams(searchParams);
    if (vehicle && !p.get('v')) {
      p.set('v', vehicle);
    }
    return p;
  }, [searchParams, vehicle]);

  const handleGo = (tab, extra = {}) => {
    if (tab === 'replay') {
      navigate(
        trackLink({
          reg: extra.v,
          from: extra.from,
          to: extra.to,
          at: extra.at,
        }),
      );
    }
  };

  const handleToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div className="intel-detours-tab">
      <IntelligenceViewSwitcher label="Detour views">
        <button
          type="button"
          role="tab"
          aria-selected={subView === 'audit'}
          className="intel-segment"
          onClick={() => setSubView('audit')}
        >
          <GitFork size={14} aria-hidden="true" />
          Route deviation audit
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={subView === 'instances'}
          className="intel-segment"
          onClick={() => setSubView('instances')}
        >
          <Zap size={14} aria-hidden="true" />
          Detour moments log
        </button>
      </IntelligenceViewSwitcher>

      {toastMsg && (
        <div className="intel-toast" role="status">
          {toastMsg}
        </div>
      )}

      {subView === 'instances' ? (
        <InstancesTab kind="detour" from={from} to={to} vehicle={vehicle} driver={driver} />
      ) : (
        <IntelligenceAuditWorkspace label="Route deviation audit">
          <DeviationView
            params={deviationParams}
            toast={handleToast}
            setBadge={() => {}}
            go={handleGo}
          />
        </IntelligenceAuditWorkspace>
      )}
    </div>
  );
}
