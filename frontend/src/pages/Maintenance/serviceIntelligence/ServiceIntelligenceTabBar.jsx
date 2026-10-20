import { Wrench, AlertOctagon, Bell } from 'lucide-react';

const TABS = [
  { key: 'SERVICE', label: 'Service History', icon: Wrench },
  { key: 'REPAIR', label: 'Repair & Breakdowns', icon: AlertOctagon },
  { key: 'ALERTS', label: 'Fleet Alerts', icon: Bell },
];

const ServiceIntelligenceTabBar = ({ activeTab, activeAlertsCount, switchTab }) => (
  <div className="si-tabs-container" role="tablist" aria-label="Service Intelligence Views">
    {TABS.map((t) => {
      const Icon = t.icon;
      const isActive = activeTab === t.key;
      return (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={isActive}
          className={`si-tab-btn ${isActive ? 'si-tab-btn--active' : ''}`}
          onClick={() => switchTab(t.key)}
        >
          <Icon size={15} />
          <span>{t.label}</span>
          {t.key === 'ALERTS' && activeAlertsCount > 0 && (
            <span className="si-tab-badge si-tab-badge--critical">{activeAlertsCount}</span>
          )}
        </button>
      );
    })}
  </div>
);

export default ServiceIntelligenceTabBar;
