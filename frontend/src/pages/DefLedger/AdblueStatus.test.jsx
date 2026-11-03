import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import DosingBadge from './DosingBadge';
import StatusBadge from './StatusBadge';

afterEach(cleanup);
describe('OEM dosing assessment', () => {
  it('shows an unassessed ratio neutrally, without an undefined band', () => {
    render(<DosingBadge vehicle={{ dosingRatioPct: 2.8, defBand: null }} />);
    const badge = screen.getByTitle('Dosing shown without a calibrated assessment band');
    expect(badge.className).toContain('bg-slate-100');
    expect(badge.textContent).toContain('2.8');
    expect(badge.title).not.toContain('undefined');
  });
  it('hides dosing assessment for explicitly inapplicable vehicles', () => {
    render(
      <DosingBadge
        vehicle={{ status: 'NOT_APPLICABLE', dosingRatioPct: 5, defBand: { min: 3, max: 6 } }}
      />,
    );
    expect(screen.getByText('Not applicable')).toBeTruthy();
    expect(screen.queryByTitle('Normal band 3–6% of diesel')).toBeNull();
  });
  it('retains Tata band assessment', () => {
    render(<DosingBadge vehicle={{ dosingRatioPct: 5, defBand: { min: 3, max: 6 } }} />);
    expect(screen.getByTitle('Normal band 3–6% of diesel').className).toContain('bg-emerald-50');
  });
  it.each(['NOT_ASSESSED', 'NOT_APPLICABLE'])(
    'renders %s without claiming compliance',
    (status) => {
      render(<StatusBadge status={status} />);
      expect(screen.queryByText('In band')).toBeNull();
      expect(
        screen.getByText(status === 'NOT_ASSESSED' ? 'Not assessed' : 'Not applicable'),
      ).toBeTruthy();
    },
  );
});
