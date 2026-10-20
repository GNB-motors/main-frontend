import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmissionNorm from './EmissionNorm.jsx';
import { isBs6Vehicle, providerLabel, providerPill } from './vehicle360Provider.js';

describe('vehicle360Provider', () => {
  it('BS-VI only on a positive signal', () => {
    expect(isBs6Vehicle({ isBs6: true }, null)).toBe(true);
    expect(isBs6Vehicle({ isBs6: false }, null)).toBe(false);
    expect(isBs6Vehicle({ isBs6: null }, null)).toBe(false);
    expect(isBs6Vehicle(null, null)).toBe(false);
    for (const norm of ['BS6', 'BS-VI', 'BSVI', 'bs vi', 'BS-6']) {
      expect(isBs6Vehicle(null, { emissionNorm: norm })).toBe(true);
    }
    for (const norm of ['BS4', 'BS-IV', 'BSIII', '', 'BS6-ready', 'not BS6', 'BS-VII']) {
      expect(isBs6Vehicle(null, { emissionNorm: norm })).toBe(false);
    }
  });

  it('renders the badge only when bs6 is true', () => {
    const { rerender } = render(<EmissionNorm norm="BS-VI" bs6 />);
    expect(screen.getByText('BS-VI', { selector: 'span.rounded' })).toBeTruthy();
    rerender(<EmissionNorm norm="BS-IV" bs6={false} />);
    expect(screen.queryByText('BS-VI')).toBeNull();
    expect(screen.getByText('BS-IV')).toBeTruthy();
  });

  it('provider pill/label only for known providers', () => {
    expect(providerPill('IALERT')).toEqual({ id: 'tp-IALERT', tone: 'grey', label: 'iALERT' });
    expect(providerPill('FLEETEDGE').label).toBe('FleetEdge');
    expect(providerPill(null)).toBeNull();
    expect(providerLabel(undefined)).toBeNull();
  });
});
