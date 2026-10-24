import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom';
import DashboardLayout from './DashboardLayout';

vi.mock('./Sidebar.jsx', () => ({
  default: () => (
    <nav>
      <Link to="/fine">open fine page</Link>
    </nav>
  ),
}));

vi.mock('./Navbar.jsx', () => ({
  default: () => <header>navbar</header>,
}));

vi.mock('./cluster/CommandPalette.jsx', () => ({
  default: () => null,
}));

vi.mock('../contexts/FeatureFlagsContext.jsx', () => ({
  FeatureFlagsProvider: ({ children }) => children,
  // UsageAnalyticsProvider (rendered by the real layout) reads canAccess and the
  // nav helpers read isEnabled, so both must be callable — not just profile/ready.
  useFeatureFlags: () => ({
    profile: null,
    ready: true,
    canAccess: () => false,
    isEnabled: () => false,
  }),
}));

vi.mock('../contexts/BranchContext.jsx', () => ({
  BranchProvider: ({ children }) => children,
  useActiveBranch: () => ({ branchId: null }),
}));

vi.mock('../contexts/SupportPortalProvider.jsx', () => ({
  default: ({ children }) => children,
}));

vi.mock('../utils/sentry', () => ({
  captureException: vi.fn(),
}));

const CrashingPage = () => {
  throw new Error('page exploded');
};

function renderLayoutAt(path) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route path="/broken" element={<CrashingPage />} />
          <Route path="/fine" element={<p>fine page</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('DashboardLayout', () => {
  it('keeps the sidebar and navbar up when a page crashes', () => {
    renderLayoutAt('/broken');
    expect(screen.getByText('page exploded')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'open fine page' })).toBeInTheDocument();
    expect(screen.getByText('navbar')).toBeInTheDocument();
  });

  it('recovers when the user navigates to another page', () => {
    renderLayoutAt('/broken');
    fireEvent.click(screen.getByRole('link', { name: 'open fine page' }));
    expect(screen.getByText('fine page')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
