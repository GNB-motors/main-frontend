import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { DetailsPanel } from './profileDetailsPanel';

vi.mock('../../components/CompanyLogoUploader.jsx', () => ({ default: () => null }));

const renderPanel = (props) =>
  render(
    <MemoryRouter>
      <DetailsPanel user={{ firstName: 'A' }} organization={{}} {...props} />
    </MemoryRouter>,
  );

describe('Profile DetailsPanel', () => {
  it('shows the person and the organisation', () => {
    renderPanel({});
    expect(screen.getByText('Personal Information')).toBeInTheDocument();
    expect(screen.getByText('Organisation Details')).toBeInTheDocument();
  });

  it('leaves org setup to Settings', () => {
    renderPanel({});
    expect(screen.queryByText('Fleet Data Coverage')).not.toBeInTheDocument();
    expect(screen.queryByText('Idling')).not.toBeInTheDocument();
    expect(screen.queryByText('Locations')).not.toBeInTheDocument();
  });
});
