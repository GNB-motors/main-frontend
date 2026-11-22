import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Suspense } from 'react';

vi.mock('../../pages/Approvals/ApprovalsPage.jsx', () => ({
  default: () => <div>Approvals page</div>,
}));
vi.mock('../../pages/Superadmin/components/ReceiptApprovalDetailPage.jsx', () => ({
  default: () => <div>Receipt approval detail</div>,
}));

import dashboardRoutes from './dashboardRoutes';

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      {/* The shell's own loader — the route's inner fallback must win. */}
      <Suspense fallback={<div>outer shell</div>}>
        <Routes>{dashboardRoutes}</Routes>
      </Suspense>
    </MemoryRouter>,
  );

describe('dashboard routes', () => {
  // U09 — the approval routes used `fallback={null}`, so the content area went
  // blank while the chunk loaded.
  it('shows a page-shaped placeholder while an approval route loads', async () => {
    renderAt('/approvals');

    expect(screen.getByTestId('route-fallback')).toBeInTheDocument();
    expect(screen.queryByText('Approvals page')).not.toBeInTheDocument();

    // The real page replaces the placeholder once the chunk is in.
    await screen.findByText('Approvals page');
    expect(screen.queryByTestId('route-fallback')).not.toBeInTheDocument();
  });
});
