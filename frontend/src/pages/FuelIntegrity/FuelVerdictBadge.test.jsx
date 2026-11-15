import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FuelVerdictBadge from './FuelVerdictBadge';

describe('FuelVerdictBadge', () => {
  it('says the litres are explained by the driving', () => {
    render(<FuelVerdictBadge fuelWindow={{ verdict: 'EXPLAINED_BY_DRIVING' }} />);
    expect(screen.getByText('Explained by driving')).toBeInTheDocument();
  });

  it('says fuel went down while parked, as a fact', () => {
    render(<FuelVerdictBadge fuelWindow={{ verdict: 'UNEXPLAINED_WHILE_PARKED' }} />);
    expect(screen.getByText('Went down while parked')).toBeInTheDocument();
  });

  it('says the fill and the bill disagree', () => {
    render(<FuelVerdictBadge fuelWindow={{ verdict: 'FILL_MISMATCH' }} />);
    expect(screen.getByText("Fill doesn't match bill")).toBeInTheDocument();
  });

  it('says we cannot tell yet', () => {
    render(<FuelVerdictBadge fuelWindow={{ verdict: 'NOT_ENOUGH_DATA' }} />);
    expect(screen.getByText('Not enough data')).toBeInTheDocument();
  });

  it('says the check has not been made when there is no verdict', () => {
    render(<FuelVerdictBadge fuelWindow={{}} />);
    expect(screen.getByText('Not checked yet')).toBeInTheDocument();
  });

  it('never shows an accusation', () => {
    const { container } = render(
      <FuelVerdictBadge fuelWindow={{ verdict: 'UNEXPLAINED_WHILE_PARKED' }} />,
    );
    expect(container.textContent.toLowerCase()).not.toMatch(/siphon|theft|stolen|steal/);
  });
});
