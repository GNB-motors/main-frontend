import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { BranchProvider, useActiveBranch } from './BranchContext.jsx';
import { clearSession } from '../utils/session.js';

vi.mock('../services/branchService', () => ({
  BranchService: { listBranches: vi.fn().mockResolvedValue([]) },
}));

// Sidebar, Navbar, LocationSwitcher and DashboardLayout all consume this
// context; an unchanged selection must not hand them a new value object.
describe('BranchProvider value identity', () => {
  beforeEach(() => {
    clearSession();
  });

  it('keeps the same value object when the provider re-renders with no change', async () => {
    const seen = [];
    function ValueProbe() {
      seen.push(useActiveBranch());
      return null;
    }
    const tree = (
      <BranchProvider>
        <ValueProbe />
      </BranchProvider>
    );

    const { rerender } = render(tree);
    await waitFor(() => expect(seen.at(-1).loading).toBe(false));

    rerender(
      <BranchProvider>
        <ValueProbe />
      </BranchProvider>,
    );

    expect(seen.at(-1)).toBe(seen.at(-2));
  });
});
