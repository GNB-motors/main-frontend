import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import ProfilePage from './ProfilePage';

const flags = vi.hoisted(() => ({ value: {} }));
vi.mock('../../contexts/FeatureFlagsContext.jsx', () => ({ useFeatureFlags: () => flags.value }));
vi.mock('../../components/CompanyLogoUploader.jsx', () => ({ default: () => null }));

const renderPage = () =>
  render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>,
  );

describe('ProfilePage', () => {
  beforeEach(() => {
    flags.value = { profile: null, ready: false, refresh: vi.fn() };
  });

  it('shows the skeleton until the shell has the profile', () => {
    renderPage();
    expect(screen.queryByText('Failed to load profile information.')).not.toBeInTheDocument();
    expect(screen.queryByText('Personal Information')).not.toBeInTheDocument();
  });

  // The page used to fetch /api/auth/me a second time; it now reads the shell's copy.
  it('renders the user and organization from the shared /api/auth/me payload', () => {
    flags.value = {
      ...flags.value,
      ready: true,
      profile: {
        user: { firstName: 'Asha', lastName: 'Rao', email: 'asha@gnb.in', role: 'OWNER' },
        organization: { companyName: 'GNB Motors' },
      },
    };
    renderPage();
    expect(screen.getByText('Personal Information')).toBeInTheDocument();
    expect(screen.getAllByText('GNB Motors').length).toBeGreaterThan(0);
  });

  it('offers a retry when /api/auth/me failed', () => {
    flags.value = { ...flags.value, ready: true };
    renderPage();
    expect(screen.getByText('Failed to load profile information.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(flags.value.refresh).toHaveBeenCalledTimes(1);
  });
});
