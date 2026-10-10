import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { DetailsPanel } from './profileDetailsPanel';

vi.mock('./profileLocationsManager', () => ({ LocationsManager: () => null }));
vi.mock('./profileIdleSetting', () => ({ IdleThresholdSetting: () => null }));
vi.mock('../../components/CompanyLogoUploader.jsx', () => ({ default: () => null }));

const renderPanel = (props) =>
  render(
    <MemoryRouter>
      <DetailsPanel user={{ firstName: 'A' }} organization={{}} {...props} />
    </MemoryRouter>,
  );

describe('Profile DetailsPanel — fleet coverage entry', () => {
  it('links to /fleet-coverage when allowed', () => {
    renderPanel({ showFleetCoverage: true });
    expect(screen.getByRole('link', { name: /View fleet coverage/ })).toHaveAttribute(
      'href',
      '/fleet-coverage',
    );
  });

  it('is absent otherwise', () => {
    renderPanel({});
    expect(screen.queryByText('Fleet Data Coverage')).not.toBeInTheDocument();
  });
});
