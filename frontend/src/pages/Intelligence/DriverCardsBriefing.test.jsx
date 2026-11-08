import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import DriverCardsBriefing from './DriverCardsBriefing';

const card = (id, kmInPeriod, trucks) => ({
  id,
  subject: 'driver',
  grade: 'NOT_ENOUGH_DATA',
  score: null,
  kmInPeriod,
  assignmentCoverage: { assignmentCount: 1, measuredDays: kmInPeriod == null ? 0 : 1, trucks },
});

describe('DriverCardsBriefing', () => {
  it('counts distinct trucks and real zero distance without inventing scores', () => {
    const onGrade = vi.fn();
    render(
      <DriverCardsBriefing
        cards={[card('a', 0, ['WB11T0662']), card('b', null, ['WB11T0662'])]}
        onGrade={onGrade}
      />,
    );
    expect(
      screen.getByRole('button', { name: /Measured distance 0 km 1 drivers/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Assigned trucks 1 Distinct/ })).toBeInTheDocument();
    expect(screen.queryByText('Average score')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Insufficient data 2/ }));
    expect(onGrade).toHaveBeenCalledWith('NOT_ENOUGH_DATA');
  });
  it('keeps missing measurements and older API coverage unknown', () => {
    render(
      <DriverCardsBriefing
        cards={[{ id: 'a', grade: 'NOT_ENOUGH_DATA', score: null, kmInPeriod: null }]}
        onGrade={vi.fn()}
      />,
    );
    expect(
      within(screen.getByRole('button', { name: /Measured distance/ })).getByText('—'),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('button', { name: /Assigned trucks/ })).getByText('—'),
    ).toBeInTheDocument();
  });
  it('shows measured performance assessments when supplied by the API', () => {
    render(
      <DriverCardsBriefing cards={[{ id: 'a', grade: 'GOOD', score: 72 }]} onGrade={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: /Average score 72/ })).toBeInTheDocument();
    expect(screen.queryByText('Performance scores are not available yet')).not.toBeInTheDocument();
  });
});
