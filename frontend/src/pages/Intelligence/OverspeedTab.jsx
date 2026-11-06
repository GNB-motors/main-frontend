import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Gauge, Zap } from 'lucide-react';
import OverspeedView from '../RouteHub/views/OverspeedView.jsx';
import InstancesTab from './InstancesTab.jsx';
import { trackLink } from '../../utils/redesign/links.js';
import '../RouteHub/routeHubDesign.css';
import './IntelligencePage.css';

export default function OverspeedTab({ from, to, vehicle = '', driver = '' }) {
  const [subView, setSubView] = useState('audit'); // 'audit' | 'instances'
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [toastMsg, setToastMsg] = useState(null);

  const overspeedParams = useMemo(() => {
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
    <div className="intel-overspeed-tab">
      <div className="intel-subview-toggle-bar">
        <div role="tablist" aria-label="Overspeed views" className="intel-segmented">
          <button
            type="button"
            role="tab"
            aria-selected={subView === 'audit'}
            className="intel-segment"
            onClick={() => setSubView('audit')}
          >
            <Gauge size={14} aria-hidden="true" />
            Speed audit & traces
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={subView === 'instances'}
            className="intel-segment"
            onClick={() => setSubView('instances')}
          >
            <Zap size={14} aria-hidden="true" />
            Overspeed moments log
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="intel-toast" role="status">
          {toastMsg}
        </div>
      )}

      {subView === 'instances' ? (
        <InstancesTab kind="overspeed" from={from} to={to} vehicle={vehicle} driver={driver} />
      ) : (
        <div className="nova-rh intel-overspeed-embed">
          <OverspeedView
            params={overspeedParams}
            toast={handleToast}
            setBadge={() => {}}
            go={handleGo}
          />
        </div>
      )}
    </div>
  );
}

