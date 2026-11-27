import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import WhatsAppAuditPage from './WhatsAppAuditPage';

const { WhatsAppAuditService } = vi.hoisted(() => ({
  WhatsAppAuditService: {
    getStats: vi.fn(),
    getRequests: vi.fn(),
    getRequestTrace: vi.fn(),
    replayMessage: vi.fn(),
    getOrganizations: vi.fn(),
    getGroups: vi.fn(),
    updateGroupOrg: vi.fn(),
  },
}));

vi.mock('./WhatsAppAuditService', () => ({ WhatsAppAuditService }));
vi.mock('./whatsappAudit/AuditHeader', () => ({ default: () => <div>audit header</div> }));
vi.mock('./whatsappAudit/AuditKpiCards', () => ({ default: () => <div>kpi cards</div> }));
vi.mock('./whatsappAudit/AuditAnalytics', () => ({ default: () => <div>analytics</div> }));
vi.mock('./whatsappAudit/AuditRequestsSection', () => ({ default: () => <div>requests</div> }));
vi.mock('./whatsappAudit/AuditTraceDrawer', () => ({ default: () => null }));
vi.mock('./whatsappAudit/AuditToast', () => ({ default: () => null }));
vi.mock('./whatsappAudit/AuditGroupsTab', () => ({ default: () => <div>groups tab</div> }));

describe('WhatsApp audit page tabs (spec 1 / D1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    WhatsAppAuditService.getStats.mockResolvedValue({});
    WhatsAppAuditService.getRequests.mockResolvedValue({ items: [], pagination: {} });
    WhatsAppAuditService.getOrganizations.mockResolvedValue([]);
  });

  afterEach(() => cleanup());

  it('opens the reliability audit and can switch to the groups tab', async () => {
    render(<WhatsAppAuditPage />);
    await waitFor(() => expect(WhatsAppAuditService.getRequests).toHaveBeenCalled());

    expect(screen.getByText('audit header')).toBeInTheDocument();
    expect(screen.getByText('requests')).toBeInTheDocument();
    expect(screen.queryByText('groups tab')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Groups' }));

    expect(screen.getByText('groups tab')).toBeInTheDocument();
    expect(screen.queryByText('audit header')).toBeNull();
  });

  it('keeps the audit filters working on the reliability tab', () => {
    render(<WhatsAppAuditPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Reliability' }));
    expect(screen.getByText('audit header')).toBeInTheDocument();
  });
});
