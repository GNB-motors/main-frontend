import { expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import IssuesBriefing from './IssuesBriefing';

it('renders server counts and connects briefing actions to issue filters', () => {
  const onFilter = vi.fn();
  render(
    <IssuesBriefing
      onFilter={onFilter}
      briefing={{
        occurrences: 249,
        vehicles: 74,
        accounts: 2,
        kinds: 6,
        needsYou: 11,
        watch: 8,
        highlights: [{ kind: 'NO_DATA', label: 'Not reporting', subjects: 11, vehicles: 11 }],
        note: 'Findings need evidence review.',
      }}
    />,
  );
  expect(
    screen.getByText(/249 recorded occurrences across 74 trucks and 2 accounts/),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Needs you/ }));
  expect(onFilter).toHaveBeenLastCalledWith('act');
  fireEvent.click(screen.getByRole('button', { name: /Not reporting: 11 trucks/ }));
  expect(onFilter).toHaveBeenCalledTimes(2);
  expect(screen.queryByText(/within 7 days/)).not.toBeInTheDocument();
});
