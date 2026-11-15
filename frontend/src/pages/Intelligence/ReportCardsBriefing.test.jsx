import { cardsBriefing } from './reportCardsBriefingModel';
import { expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ReportCardsBriefing, { ScoreSparkline } from './ReportCardsBriefing';

it('averages measured grades only and does not turn missing scores into zero', () => {
  expect(
    cardsBriefing([
      { score: 80, grade: 'GOOD' },
      { score: 60, grade: 'FAIR' },
      { score: null, grade: 'NOT_ENOUGH_DATA' },
    ]),
  ).toMatchObject({ averageScore: 70, graded: 2, ungraded: 1 });
  expect(cardsBriefing([{ score: null }]).averageScore).toBeNull();
});
it('filters by the briefing action without manufacturing predictions', () => {
  const onGrade = vi.fn();
  render(
    <ReportCardsBriefing
      subject="vehicle"
      cards={[{ score: 60, grade: 'FALLING' }]}
      onGrade={onGrade}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: /1 trucks are falling off/ }));
  expect(onGrade).toHaveBeenCalledWith('FALLING');
  expect(screen.queryByText(/will slip/)).not.toBeInTheDocument();
});
it('draws only recorded score points and leaves absent history unplotted', () => {
  const { rerender } = render(<ScoreSparkline history={[]} />);
  expect(screen.queryByRole('img')).not.toBeInTheDocument();
  rerender(
    <ScoreSparkline
      history={[
        { day: '2026-11-01', score: 70 },
        { day: '2026-11-03', score: 80 },
      ]}
    />,
  );
  expect(screen.getByRole('img')).toHaveAccessibleName(/2026-11-01: 70, 2026-11-03: 80/);
  expect(
    screen.getByRole('img').querySelector('polyline').getAttribute('points').split(' '),
  ).toHaveLength(2);
});
