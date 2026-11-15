import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate, useLocation } from 'react-router-dom';

vi.mock('./IntelligenceService', () => ({
  default: { getReportCards: vi.fn() },
}));
vi.mock('@/pages/Trip/services/TripService', () => ({
  default: { getDrivers: vi.fn().mockResolvedValue({ data: [] }) },
}));

import IntelligenceService from './IntelligenceService';
import TripService from '@/pages/Trip/services/TripService';
import ReportCardsTab from './ReportCardsTab';

const cards = {
  items: [
    {
      id: 'WB11F6762',
      subject: 'vehicle',
      name: 'WB11F6762',
      make: 'Tata',
      grade: 'EXCELLENT',
      trend: 'UP',
      score: 88,
      headline: 'Best km/L in the fleet this week',
      strengths: [],
      problems: [],
      basis: { text: 'From the truck.', basis: '1,240 km · 9 trips' },
    },
    {
      id: 'drv-441',
      subject: 'driver',
      name: 'Ramesh Yadav',
      grade: 'GOOD',
      headline: 'Drives steadily',
      strengths: [],
      problems: [],
      basis: { text: 'From the driver.', basis: '9 trips' },
    },
  ],
};

describe('ReportCardsTab', () => {
  it.each(['EXCELLENT', 'FALLING'])(
    'opens a %s link on the selected category, including zero matches and history',
    async (grade) => {
      IntelligenceService.getReportCards.mockResolvedValue({
        items: [
          {
            id: 'ungraded',
            subject: 'driver',
            name: 'No score driver',
            score: null,
            strengths: [],
            problems: [],
          },
        ],
      });
      function History() {
        const navigate = useNavigate();
        const location = useLocation();
        return (
          <>
            <button onClick={() => navigate(-1)}>Back</button>
            <output>{location.search}</output>
          </>
        );
      }
      render(
        <MemoryRouter
          initialEntries={[
            `/intelligence?tab=drivers&grade=${grade}&from=2026-07-18&to=2026-11-14`,
          ]}
        >
          <History />
          <ReportCardsTab subject="driver" from="2026-07-18" to="2026-11-14" />
        </MemoryRouter>,
      );
      const label = grade === 'EXCELLENT' ? 'Excellent' : 'Falling off';
      expect(
        await screen.findByRole('button', { name: `${label} 0`, exact: true }),
      ).toHaveAttribute('aria-pressed', 'true');
      expect(screen.queryByText('No score driver')).not.toBeInTheDocument();
      expect(screen.getByText(`No ${label} drivers in this selection`)).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'All 1', exact: true }));
      expect(screen.getByText('No score driver')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent('from=2026-07-18');
      fireEvent.click(screen.getByRole('button', { name: 'Back', exact: true }));
      expect(screen.getByRole('button', { name: `${label} 0`, exact: true })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(screen.queryByText('No score driver')).not.toBeInTheDocument();
    },
  );

  it('filters graded rows by the linked grade rather than merely highlighting the chip', async () => {
    IntelligenceService.getReportCards.mockResolvedValue({
      items: [
        {
          ...cards.items[0],
          id: 'excellent',
          name: 'Excellent driver',
          subject: 'driver',
          grade: 'EXCELLENT',
          score: 95,
        },
        {
          ...cards.items[0],
          id: 'falling',
          name: 'Falling driver',
          subject: 'driver',
          grade: 'FALLING',
          score: 30,
        },
      ],
    });
    render(
      <MemoryRouter initialEntries={['/intelligence?tab=drivers&grade=FALLING']}>
        <ReportCardsTab subject="driver" />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Falling driver')).toBeInTheDocument();
    expect(screen.queryByText('Excellent driver')).not.toBeInTheDocument();
  });
  beforeEach(() => {
    vi.clearAllMocks();
    TripService.getDrivers.mockResolvedValue({ data: [] });
  });

  it('shows assignment coverage and searches drivers by their assigned truck', async () => {
    IntelligenceService.getReportCards.mockResolvedValue({
      items: [
        {
          ...cards.items[1],
          kmInPeriod: 0,
          assignmentCoverage: { trucks: ['WB11T0662'], assignmentCount: 2, measuredDays: 1 },
        },
        {
          ...cards.items[1],
          id: 'other-driver',
          name: 'Other Driver',
          assignmentCoverage: { trucks: ['BR44GB1162'], assignmentCount: 1, measuredDays: 0 },
        },
      ],
    });
    render(
      <MemoryRouter>
        <ReportCardsTab subject="driver" />
      </MemoryRouter>,
    );
    await screen.findByText('Ramesh Yadav');
    expect(screen.getByRole('columnheader', { name: 'Assignments' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Measured days' })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Score' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search drivers' }), {
      target: { value: 'WB11T0662' },
    });
    expect(screen.getByText('Ramesh Yadav')).toBeInTheDocument();
    expect(screen.queryByText('Other Driver')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Open the full card for Ramesh Yadav' }));
    expect(await screen.findByRole('region', { name: 'Assignment coverage' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'WB11T0662 →' })).toHaveAttribute(
      'href',
      '/vehicles/WB11T0662',
    );
  });

  it('resolves driver ids to names', async () => {
    const id = '65f1c2a4b7d9e12345678901';
    IntelligenceService.getReportCards.mockResolvedValue({
      items: [{ id, subject: 'driver', name: id }],
    });
    TripService.getDrivers.mockResolvedValue({
      data: [{ _id: id, firstName: 'Ramesh', lastName: 'Yadav' }],
    });
    render(
      <MemoryRouter>
        <ReportCardsTab subject="driver" />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Ramesh Yadav')).toBeInTheDocument();
    expect(screen.queryByText(id)).not.toBeInTheDocument();
  });

  it('shows the truck cards in their columns, and only the truck cards', async () => {
    IntelligenceService.getReportCards.mockResolvedValue(cards);

    render(
      <MemoryRouter>
        <ReportCardsTab subject="vehicle" from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    expect(await screen.findByText('WB11F6762')).toBeInTheDocument();
    expect(screen.queryByText('Ramesh Yadav')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Excellent 1' })).toBeInTheDocument();
  });

  it('shows the driver cards on the drivers tab', async () => {
    IntelligenceService.getReportCards.mockResolvedValue(cards);

    render(
      <MemoryRouter>
        <ReportCardsTab subject="driver" from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Ramesh Yadav')).toBeInTheDocument();
    expect(screen.queryByText('WB11F6762')).not.toBeInTheDocument();
  });

  it('searches by plate', async () => {
    IntelligenceService.getReportCards.mockResolvedValue(cards);

    render(
      <MemoryRouter>
        <ReportCardsTab subject="vehicle" from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    await screen.findByText('WB11F6762');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'WB11F' } });

    expect(screen.getByText('WB11F6762')).toBeInTheDocument();
  });

  it('says there is nothing to show when the period has no cards', async () => {
    IntelligenceService.getReportCards.mockResolvedValue({ items: [] });

    render(
      <MemoryRouter>
        <ReportCardsTab subject="vehicle" from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    expect(await screen.findByText('No truck cards for this period yet.')).toBeInTheDocument();
  });

  it('says the endpoint is still being built on a 404', async () => {
    IntelligenceService.getReportCards.mockRejectedValue({ status: 404 });

    render(
      <MemoryRouter>
        <ReportCardsTab subject="vehicle" from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByText(/is being built/)).toBeInTheDocument());
  });

  it('shows the reason the backend is holding the cards back', async () => {
    IntelligenceService.getReportCards.mockResolvedValue({
      held: true,
      why: { text: 'Driver scores need to know who drove which truck.' },
    });

    render(
      <MemoryRouter>
        <ReportCardsTab subject="driver" from="2026-10-27" to="2026-11-02" />
      </MemoryRouter>,
    );

    expect(
      await screen.findByText('Driver scores need to know who drove which truck.'),
    ).toBeInTheDocument();
  });
  it('shows ungraded trucks and scopes the table to the selected vehicle', async () => {
    IntelligenceService.getReportCards.mockResolvedValue({
      items: [
        ...cards.items,
        {
          id: 'BR44GB1162',
          name: 'BR44GB1162',
          subject: 'vehicle',
          grade: 'NOT_ENOUGH_DATA',
          strengths: [],
          problems: [],
        },
      ],
    });
    render(
      <MemoryRouter>
        <ReportCardsTab subject="vehicle" vehicle="BR44GB1162" />
      </MemoryRouter>,
    );
    expect(await screen.findByText('BR44GB1162')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Insufficient data 1' })).toBeInTheDocument();
    expect(screen.queryByText('WB11F6762')).not.toBeInTheDocument();
  });

  it('does not present an unscored driver as good', async () => {
    IntelligenceService.getReportCards.mockResolvedValue(cards);
    render(
      <MemoryRouter>
        <ReportCardsTab subject="driver" />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Ramesh Yadav')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Insufficient data 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Good 0' })).toBeInTheDocument();
  });
});
