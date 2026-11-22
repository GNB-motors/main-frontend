import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('./IntelligenceService', () => ({
  default: { getInstances: vi.fn() },
}));

import IntelligenceService from './IntelligenceService';
import InstancesTab from './InstancesTab';
import IssueGroup from './IssueGroup';
import { groupIssuesByKind } from './intelligenceModel';

const instances = {
  kind: 'idle',
  summary: {
    count: 12,
    totalMin: 126,
    totalL: null,
    totalInr: null,
    why: {
      text: 'Engine on, not moving, for more than 15 minutes.',
      basis: 'From 1,240 km of driving this week',
    },
  },
  items: [
    {
      id: 'inst-1',
      registrationNumber: 'WB11L8862',
      driverName: 'Ramesh Yadav',
      startAt: '2026-11-01T15:05:00Z',
      endAt: '2026-11-01T15:45:00Z',
      durationMin: 40,
      place: {
        id: 'poi-202',
        kind: 'POI',
        name: 'Mohania Dhaba',
        category: 'DHABA',
        lat: 24.37,
        lng: 84.98,
      },
      value: 40,
      unit: 'min',
      text: 'Idled 40 min with engine on at Mohania dhaba',
      replay: { label: 'Watch it', to: '/live-tracking?v=WB11L8862' },
      trip: null,
    },
  ],
  total: 1,
};

describe('InstancesTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    IntelligenceService.getInstances.mockResolvedValue(instances);
  });

  it('shows the actual fuel-window data on bar hover and keyboard focus', async () => {
    IntelligenceService.getInstances.mockResolvedValue({
      kind: 'fuel_unexplained',
      summary: { count: 1 },
      total: 1,
      items: [
        { ...instances.items[0], value: 32.5, unit: 'L', text: 'Fuel decreased while parked.' },
      ],
    });
    render(
      <MemoryRouter>
        <InstancesTab kind="fuel_unexplained" from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );
    const bar = await screen.findByRole('button', { name: /WB11L8862: 32.5 L unaccounted fuel/ });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    fireEvent.mouseEnter(bar);
    expect(screen.getByRole('tooltip')).toHaveTextContent('WB11L8862');
    expect(screen.getByRole('tooltip')).toHaveTextContent('32.5 L');
    expect(screen.getByRole('tooltip')).toHaveTextContent('Mohania Dhaba');
    fireEvent.mouseLeave(bar);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    fireEvent.focus(bar);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
    fireEvent.blur(bar);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('says what the system saw, and why', async () => {
    render(
      <MemoryRouter>
        <InstancesTab kind="idle" from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText('Engine on, not moving, for more than 15 minutes.'),
    ).toBeInTheDocument();
    expect(screen.getByText('From 1,240 km of driving this week')).toBeInTheDocument();
    expect(screen.getAllByText('12')).toHaveLength(2);
    expect(screen.getByText('2 h 6 min')).toBeInTheDocument();
    expect(screen.getByText('in total')).toBeInTheDocument();
  });

  it('lists every moment with the place and the replay', async () => {
    render(
      <MemoryRouter>
        <InstancesTab kind="idle" from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    expect(await screen.findByText('WB11L8862')).toBeInTheDocument();
    expect(screen.getByText('Ramesh Yadav')).toBeInTheDocument();
    expect(screen.getByText('Mohania Dhaba')).toBeInTheDocument();
    expect(screen.getByText('Idled 40 min with engine on at Mohania dhaba')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Watch it/ })).toHaveAttribute(
      'href',
      '/live-tracking?v=WB11L8862',
    );
  });

  it('asks the API for the kind it was given', async () => {
    render(
      <MemoryRouter>
        <InstancesTab kind="overspeed" from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(IntelligenceService.getInstances).toHaveBeenCalledWith(
        expect.objectContaining({
          kind: 'overspeed',
          from: '2026-10-27',
          to: '2026-11-02',
          page: 1,
          limit: 25,
        }),
      ),
    );
  });

  it('says the good news when nothing of that kind happened', async () => {
    IntelligenceService.getInstances.mockResolvedValue({
      summary: { count: 0, totalMin: 0, totalL: null, totalInr: null, why: { text: 'Nothing.' } },
      items: [],
      total: 0,
    });

    render(
      <MemoryRouter>
        <InstancesTab kind="overspeed" from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText('No truck went over the limit for long in this period.'),
    ).toBeInTheDocument();
  });

  it('says the endpoint is still being built on a 404', async () => {
    IntelligenceService.getInstances.mockRejectedValue({ status: 404 });

    render(
      <MemoryRouter>
        <InstancesTab kind="idle" from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText(/is being built/)).toBeInTheDocument());
  });

  it('splits cruise and gears into two kinds', async () => {
    render(
      <MemoryRouter>
        <InstancesTab kind="cruise" from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Gears' }));

    await waitFor(() =>
      expect(IntelligenceService.getInstances).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'gear' }),
      ),
    );
  });

  it('lists a truck once with its dated findings, and gives every row its own key', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    // The API sends one record per check of a truck, and the checks share the
    // issue id — so the table must not repeat the truck or reuse a key.
    const check = (lastSeenAt, days) => ({
      id: 'iss-77',
      kind: 'NO_DATA',
      severity: 'act',
      registrationNumber: 'WB11F0162',
      title: 'No data from WB11F0162',
      detail: `No reading for ${days} days, while the telematics account feeding this truck is healthy.`,
      advice: 'Check that the tracker has power and the SIM is active.',
      firstSeenAt: '2026-10-28T05:00:00Z',
      lastSeenAt,
      occurrences: 1,
      evidence: [],
      action: null,
    });
    const [group] = groupIssuesByKind([
      check('2026-11-01T23:40:00Z', 4),
      check('2026-11-03T23:40:00Z', 6),
    ]);

    const { unmount } = render(
      <MemoryRouter>
        <IssueGroup group={group} />
      </MemoryRouter>,
    );

    // One row for the truck, and the truck count beside the finding count.
    expect(screen.getAllByRole('button', { name: /WB11F0162: show details/ })).toHaveLength(1);
    expect(screen.getByText('1 truck')).toBeInTheDocument();
    expect(screen.getByText('2 findings')).toBeInTheDocument();
    expect(screen.getByText('6 days')).toBeInTheDocument();

    // Both checks stay inside that row, each with its own date.
    fireEvent.click(screen.getByRole('button', { name: /WB11F0162: show details/ }));
    expect(
      screen.getByText(
        'No reading for 4 days, while the telematics account feeding this truck is healthy.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'No reading for 6 days, while the telematics account feeding this truck is healthy.',
      ),
    ).toBeInTheDocument();
    expect(
      consoleError.mock.calls.filter((call) => String(call[0]).includes('same key')),
    ).toHaveLength(0);
    unmount();

    // Two moments that start together are two rows, each with its own key.
    IntelligenceService.getInstances.mockResolvedValue({
      kind: 'idle',
      summary: {
        count: 2,
        totalMin: 80,
        totalL: null,
        totalInr: null,
        why: { text: 'Engine on, not moving.' },
      },
      total: 2,
      items: [
        { ...instances.items[0], id: undefined, registrationNumber: 'WB11L8862' },
        {
          ...instances.items[0],
          id: undefined,
          registrationNumber: 'WB11F0162',
          text: 'Idled 40 min with engine on at another stop',
        },
      ],
    });
    render(
      <MemoryRouter>
        <InstancesTab kind="idle" from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    expect(await screen.findByText('WB11L8862')).toBeInTheDocument();
    expect(screen.getByText('WB11F0162')).toBeInTheDocument();
    expect(
      consoleError.mock.calls.filter((call) => String(call[0]).includes('same key')),
    ).toHaveLength(0);
    consoleError.mockRestore();
  });
});
