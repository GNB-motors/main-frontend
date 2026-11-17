import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TrackReviewActions from './TrackReviewActions.jsx';
import EditPlaceDialog from './EditPlaceDialog.jsx';
import { ErpSiteService } from '../../services/erpSiteService.js';
import PlaceHubService from '../PlaceHub/PlaceHubService.js';

vi.mock('../../services/erpSiteService.js', () => ({ ErpSiteService: { update: vi.fn() } }));
vi.mock('../PlaceHub/PlaceHubService.js', () => ({
  default: { updateWarehouse: vi.fn(), updateZone: vi.fn() },
}));
vi.mock('../PlaceHub/intelligence/useSiteAnswer.js', () => ({
  default: () => ({ busyId: null, accept: vi.fn() }),
}));

beforeEach(() => vi.clearAllMocks());
const site = { _id: 'site1', status: 'PROPOSED', name: 'Existing place', siteType: 'UNKNOWN' };

describe('review decisions', () => {
  it('stages a type, uses a styled dropdown, and writes only after Save', async () => {
    const answer = { accept: vi.fn(), reject: vi.fn(), busyId: null };
    render(<TrackReviewActions site={site} answer={answer} />);
    fireEvent.click(screen.getByRole('button', { name: 'Parking' }));
    expect(screen.getByRole('dialog', { name: 'Confirm place' })).toBeInTheDocument();
    expect(answer.accept).not.toHaveBeenCalled();
    const picker = screen.getByRole('combobox', { name: 'Place type' });
    expect(picker.tagName).toBe('BUTTON');
    expect(picker).toHaveTextContent('Parking');
    expect(picker.querySelector('svg')).not.toBeNull();
    fireEvent.click(picker);
    const plantOption = await screen.findByRole('option', { name: 'Plant' });
    fireEvent.pointerDown(plantOption, { pointerType: 'mouse' });
    fireEvent.click(plantOption);
    expect(picker).toHaveTextContent('Plant');
    fireEvent.change(screen.getByRole('textbox', { name: 'Place name' }), {
      target: { value: 'Named plant' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save place' }));
    expect(answer.accept).toHaveBeenCalledWith(site, 'PLANT', 'Named plant');
  });
  it('cancels both type and rejection decisions without writing', () => {
    const answer = { accept: vi.fn(), reject: vi.fn(), busyId: null };
    render(<TrackReviewActions site={site} answer={answer} />);
    fireEvent.click(screen.getByRole('button', { name: 'Parking' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    fireEvent.click(screen.getByRole('button', { name: 'Not a real place' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(answer.accept).not.toHaveBeenCalled();
    expect(answer.reject).not.toHaveBeenCalled();
  });
});

describe('saved place modal', () => {
  it('edits a saved pickup/drop point through its original API', async () => {
    const saved = vi.fn();
    ErpSiteService.update.mockResolvedValue({ _id: 'erp1' });
    render(
      <EditPlaceDialog
        place={{
          id: 'site:erp1',
          sourceId: 'erp1',
          source: 'site',
          erp: true,
          name: 'Old name',
          radiusM: 100,
          raw: { name: 'Old name' },
        }}
        onClose={vi.fn()}
        onSaved={saved}
      />,
    );
    expect(ErpSiteService.update).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole('textbox', { name: 'Place name' }), {
      target: { value: 'New name' },
    });
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Fence radius (metres)' }), {
      target: { value: '250' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(saved).toHaveBeenCalled());
    expect(ErpSiteService.update).toHaveBeenCalledWith('erp1', {
      name: 'New name',
      radiusM: 250,
    });
  });
  it('edits a warehouse mirror through the warehouse API', async () => {
    const saved = vi.fn();
    PlaceHubService.updateWarehouse.mockResolvedValue({});
    render(
      <EditPlaceDialog
        place={{
          id: 'site:mirror',
          source: 'site',
          sourceId: 'mirror',
          name: 'Yard',
          radiusM: 300,
          raw: { name: 'Yard', legacy: { vehicleWarehouseId: 'warehouse1' } },
        }}
        onClose={vi.fn()}
        onSaved={saved}
      />,
    );
    fireEvent.change(screen.getByRole('textbox', { name: 'Place name' }), {
      target: { value: 'Renamed yard' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(saved).toHaveBeenCalled());
    expect(PlaceHubService.updateWarehouse).toHaveBeenCalledWith('warehouse1', {
      name: 'Renamed yard',
      geofenceRadiusM: 300,
    });
  });
});
