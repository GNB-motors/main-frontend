import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VehicleIssuesSection from './VehicleIssuesSection';

const issue = {
  id: 'iss-77',
  kind: 'GPS_FROZEN',
  severity: 'watch',
  registrationNumber: 'WB11F0162',
  accountName: null,
  title: 'GPS freezes on WB11F0162',
  detail: 'The position stopped changing for 24 minutes while the truck was moving.',
  advice: 'Check the GPS antenna cable.',
  firstSeenAt: '2026-10-28T05:00:00Z',
  lastSeenAt: '2026-11-01T09:30:00Z',
  occurrences: 3,
  evidence: [],
  action: null,
};

describe('VehicleIssuesSection', () => {
  it('shows the issue and what to do about it', () => {
    render(
      <MemoryRouter>
        <VehicleIssuesSection issues={[issue]} registrationNumber="WB11F0162" />
      </MemoryRouter>,
    );
    expect(screen.getByText('GPS freezes on WB11F0162')).toBeInTheDocument();
    expect(screen.getByText('Check the GPS antenna cable.')).toBeInTheDocument();
  });

  it('links to the full issue in Intelligence', () => {
    render(
      <MemoryRouter>
        <VehicleIssuesSection issues={[issue]} registrationNumber="WB11F0162" />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link').getAttribute('href')).toBe(
      '/intelligence?tab=issues&vehicle=WB11F0162',
    );
  });

  it('shows nothing at all when there are no issues', () => {
    const { container } = render(
      <MemoryRouter>
        <VehicleIssuesSection issues={[]} />
      </MemoryRouter>,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
