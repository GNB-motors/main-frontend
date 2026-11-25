import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import ExportButton from './ExportButton';

vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../../services/ReportEmailService', () => ({
  ReportEmailService: { sendServerReport: vi.fn(), sendFile: vi.fn(), getStatus: vi.fn() },
}));

const openMenu = () => fireEvent.click(screen.getByRole('button', { name: /Export/ }));

describe('ExportButton — the Email… item', () => {
  it('spec 6: without the email prop the menu has exactly the two download items', () => {
    render(<ExportButton rows={[]} columns={[]} filename="fleet-alerts" />);
    openMenu();
    expect(screen.getAllByRole('menuitem')).toHaveLength(2);
    expect(screen.getByRole('menuitem', { name: /Excel/ })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /CSV/ })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /Email/ })).not.toBeInTheDocument();
  });

  it('spec 6: with the email prop the menu has a third item, Email…', () => {
    render(
      <ExportButton
        rows={[]}
        columns={[]}
        filename="fleet-alerts"
        email={{ label: 'Fleet alerts report' }}
      />,
    );
    openMenu();
    expect(screen.getAllByRole('menuitem')).toHaveLength(3);
    expect(screen.getByRole('menuitem', { name: /Email/ })).toBeInTheDocument();
  });

  it('spec 6: Email… opens the e-mail dialog for that report', () => {
    render(
      <ExportButton
        rows={[]}
        columns={[]}
        filename="fleet-alerts"
        email={{ report: 'fuel-cycles', params: { format: 'xlsx' }, label: 'Oil report' }}
      />,
    );
    openMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: /Email/ }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/Email Oil report/)).toBeInTheDocument();
  });
});
