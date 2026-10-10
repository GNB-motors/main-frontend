import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import SettingsPage from './SettingsPage';
import { groupSections, settingsAccess, visibleSections } from './settingsSections';
import { getUserRole } from '../../utils/session.js';
import FleetDataService from '../../services/FleetDataService';

vi.mock('../../utils/session.js', () => ({ getUserRole: vi.fn(), getToken: () => 't' }));
vi.mock('../../contexts/FeatureFlagsContext.jsx', () => ({
  useFeatureFlags: () => ({ isEnabled: () => true, canAccess: () => true }),
}));
vi.mock('../../contexts/BranchContext.jsx', () => ({
  useActiveBranch: () => ({ branches: Array.from({ length: 6 }, (_, i) => ({ _id: `b${i}` })) }),
}));
vi.mock('../../services/FleetDataService', () => ({
  default: { getFleetCoverage: vi.fn() },
}));
vi.mock('./settingsLocations', () => ({ LocationsManager: () => <p>locations body</p> }));
vi.mock('./settingsFleetData', () => ({
  FleetDataSettings: ({ showAccounts, coverage }) => (
    <p>
      fleet body {String(showAccounts)} {String(Boolean(coverage))}
    </p>
  ),
}));
vi.mock('./settingsIdling', () => ({
  IdleThresholdSetting: ({ canEdit }) => <p>idling body {String(canEdit)}</p>,
}));
vi.mock('./settingsWhatsApp', () => ({ WhatsAppSettings: () => <p>whatsapp body</p> }));

const renderAt = (url) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <SettingsPage />
    </MemoryRouter>,
  );

const keys = (access) => visibleSections(access).map((s) => s.key);

describe('settings sections', () => {
  it('an owner of a fleet org sees every section', () => {
    const access = settingsAccess({ role: 'OWNER', fleetAccess: true, coverageFlag: true });
    expect(keys(access)).toEqual(['locations', 'fleet-data', 'idling', 'whatsapp']);
  });

  it('a driver sees locations and idling, read-only', () => {
    const access = settingsAccess({ role: 'DRIVER', fleetAccess: true, coverageFlag: true });
    expect(keys(access)).toEqual(['locations', 'idling']);
    expect(access.editIdling).toBe(false);
    expect(access.manageLocations).toBe(false);
  });

  it('an ERP-only org sees only locations', () => {
    const access = settingsAccess({ role: 'OWNER', fleetAccess: false, coverageFlag: false });
    expect(keys(access)).toEqual(['locations']);
  });

  it('groups the nav under Fleet and Rules', () => {
    const access = settingsAccess({ role: 'OWNER', fleetAccess: true, coverageFlag: true });
    expect(groupSections(visibleSections(access)).map((g) => [g.label, g.items.length])).toEqual([
      ['Fleet', 2],
      ['Rules', 2],
    ]);
  });

  it('coverage needs the fleetIntelligence flag; FleetEdge accounts do not', () => {
    const access = settingsAccess({ role: 'MANAGER', fleetAccess: true, coverageFlag: false });
    expect(access.coverage).toBe(false);
    expect(access.fleetEdgeAccounts).toBe(true);
    expect(keys(access)).toContain('fleet-data');
  });
});

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getUserRole.mockReturnValue('OWNER');
    FleetDataService.getFleetCoverage.mockResolvedValue({ summary: { onlyFleetMaster: 2 } });
  });

  it('shows the location count and offline trucks on the nav', async () => {
    renderAt('/settings');
    expect(screen.getByText('Fleet')).toBeInTheDocument();
    expect(screen.getByText('Rules')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(await screen.findByText('2 offline')).toBeInTheDocument();
  });

  it('does not ask for coverage when the viewer may not see it', () => {
    getUserRole.mockReturnValue('DRIVER');
    renderAt('/settings');
    expect(FleetDataService.getFleetCoverage).not.toHaveBeenCalled();
  });

  it('opens the first section by default', () => {
    renderAt('/settings');
    expect(screen.getByText('locations body')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Locations/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('opens the section named in the URL, and switches on click', () => {
    renderAt('/settings?section=fleet-data');
    expect(screen.getByText('fleet body true true')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Idling/ }));
    expect(screen.getByText('idling body true')).toBeInTheDocument();
  });

  it('a section the viewer may not see falls back to the first', () => {
    getUserRole.mockReturnValue('DRIVER');
    renderAt('/settings?section=whatsapp');
    expect(screen.queryByText('whatsapp body')).not.toBeInTheDocument();
    expect(screen.getByText('locations body')).toBeInTheDocument();
  });
});
