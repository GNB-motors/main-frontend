import { useSearchParams } from 'react-router-dom';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext.jsx';
import { useActiveBranch } from '../../contexts/BranchContext.jsx';
import useApi from '../../hooks/useApi';
import FleetDataService from '../../services/FleetDataService';
import { hasFleetAccess } from '../../utils/moduleAccess';
import { getUserRole } from '../../utils/session.js';
import { formatNum } from '../../utils/formatters';
import { groupSections, settingsAccess, visibleSections } from './settingsSections';
import { LocationsManager } from './settingsLocations';
import { FleetDataSettings } from './settingsFleetData';
import { IdleThresholdSetting } from './settingsIdling';
import { WhatsAppSettings } from './settingsWhatsApp';
import './Settings.css';

/**
 * Org setup in one place: locations, fleet data sources and coverage, the idle
 * threshold and the WhatsApp odometer rule. ?section= picks the open one, so
 * other pages can link straight to it.
 */
export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isEnabled, canAccess } = useFeatureFlags();
  const { branches } = useActiveBranch();
  const role = (getUserRole() || '').toUpperCase();

  const access = settingsAccess({
    role,
    fleetAccess: hasFleetAccess(isEnabled),
    coverageFlag: canAccess('fleetIntelligence'),
  });
  const sections = visibleSections(access);
  const active = sections.find((s) => s.key === searchParams.get('section')) || sections[0];

  // Fetched here, not in the section, so the nav can show the offline count too.
  const coverage = useApi((signal) => FleetDataService.getFleetCoverage(signal), [], {
    enabled: access.coverage,
  });
  const offline = coverage.data?.summary?.onlyFleetMaster ?? 0;

  const badges = {
    locations: branches?.length ? { text: formatNum(branches.length) } : null,
    'fleet-data': offline > 0 ? { text: `${formatNum(offline)} offline`, tone: 'warn' } : null,
  };

  const open = (key) => setSearchParams({ section: key }, { replace: true });

  return (
    <div className="stx-page">
      <div className="stx-wrap">
        <h1 className="stx-title">Settings</h1>

        <div className="stx-layout">
          <nav className="stx-nav" aria-label="Settings sections">
            {groupSections(sections).map((g) => (
              <div key={g.label} className="stx-nav-group">
                <p className="stx-nav-heading">{g.label}</p>
                {g.items.map((s) => {
                  const Icon = s.icon;
                  const badge = badges[s.key];
                  return (
                    <button
                      key={s.key}
                      type="button"
                      className="stx-nav-item"
                      aria-current={s.key === active.key ? 'page' : undefined}
                      onClick={() => open(s.key)}
                    >
                      <span className="stx-nav-icon" aria-hidden="true">
                        <Icon size={22} strokeWidth={1.75} />
                      </span>
                      <span className="stx-nav-text">
                        <span className="stx-nav-label">{s.label}</span>
                        <span className="stx-nav-hint">{s.hint}</span>
                      </span>
                      {badge ? (
                        <span
                          className={`stx-nav-badge${badge.tone ? ` stx-nav-badge--${badge.tone}` : ''}`}
                        >
                          {badge.text}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          <section className="stx-body" aria-labelledby={`stx-sec-${active.key}`}>
            {active.key === 'locations' ? (
              <LocationsManager canManage={access.manageLocations} />
            ) : null}
            {active.key === 'fleet-data' ? (
              <FleetDataSettings
                showAccounts={access.fleetEdgeAccounts}
                coverage={access.coverage ? coverage : null}
              />
            ) : null}
            {active.key === 'idling' ? <IdleThresholdSetting canEdit={access.editIdling} /> : null}
            {active.key === 'whatsapp' ? <WhatsAppSettings /> : null}
          </section>
        </div>
      </div>
    </div>
  );
}
