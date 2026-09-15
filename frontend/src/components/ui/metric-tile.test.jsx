import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MetricTile } from './metric-tile';

describe('MetricTile', () => {
  it('normal state renders value, unit, comparison and freshness', () => {
    render(
      <MetricTile
        label="Cost per km"
        detail="Fleet average · Aug 2026"
        state="normal"
        tone="ok"
        value="₹28.40"
        unit="per km"
        comparison={{ direction: 'down', tone: 'ok', text: '₹1.10 (3.7%) vs Jul 2026' }}
        freshness={{ text: 'Updated 4 min ago · IST', live: true }}
      />,
    );
    expect(screen.getByText('Normal')).toBeTruthy();
    expect(screen.getByText('₹28.40')).toBeTruthy();
    expect(screen.getByText('per km')).toBeTruthy();
    expect(screen.getByText('↓ ₹1.10 (3.7%) vs Jul 2026')).toBeTruthy();
    expect(screen.getByText('Updated 4 min ago · IST')).toBeTruthy();
    expect(screen.getByLabelText('Cost per km').getAttribute('data-state')).toBe('normal');
  });

  it('never-set-up state shows a dash, an explanation and a configure CTA — never a fake zero', () => {
    render(
      <MetricTile
        label="Driver score"
        detail="Fleet average · needs 7 days of trips"
        state="not-set-up"
        message="No data yet. Scoring begins once 7 days of trips are recorded."
        freshness={{ text: 'Never reported' }}
        cta={{ label: 'Set up scoring', onClick: () => {} }}
      />,
    );
    expect(screen.getByText('Not set up')).toBeTruthy();
    expect(screen.getByText('—')).toBeTruthy();
    expect(screen.getByText(/No data yet/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Set up scoring' }));
  });

  it('error state names the failure and may show a stale last-known value', () => {
    render(
      <MetricTile
        label="Fuel spend"
        detail="All branches · month to date"
        state="error"
        staleValue="₹19,40,600"
        staleCaption="Last known value · frozen 06 Sep 2026, 09:12 IST"
        message="Fuel-card feed has not answered for 3 h 41 min. This figure is stale — do not act on it."
        freshness={{ text: '3 h 41 min ago · Fuel-card API' }}
      />,
    );
    expect(screen.getByText('Error')).toBeTruthy();
    expect(screen.getByText('₹19,40,600')).toBeTruthy();
    expect(screen.getByText(/has not answered/)).toBeTruthy();
    expect(screen.getByText(/Last known value/)).toBeTruthy();
  });

  it('permission-denied state explains access instead of rendering data', () => {
    render(
      <MetricTile
        label="Driver wages"
        detail="All branches"
        state="permission-denied"
        message="You don't have permission to view this metric. Ask your administrator for the Payroll role."
        cta={{ label: 'Request access', onClick: () => {} }}
      />,
    );
    expect(screen.getByText('No access')).toBeTruthy();
    expect(screen.getByText('—')).toBeTruthy();
    expect(screen.getByText(/don't have permission/)).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Request access' })).toBeTruthy();
  });

  it('no-signal state says it is waiting for data, not that something is wrong', () => {
    render(
      <MetricTile
        label="Live odometer"
        detail="WB 23 F 4821"
        state="no-signal"
        message="Waiting for data. This vehicle has not reported since it was added 2 days ago."
        freshness={{ text: 'No signal · GPS device' }}
      />,
    );
    expect(screen.getByText('No signal')).toBeTruthy();
    expect(screen.getByText('—')).toBeTruthy();
    expect(screen.getByText(/Waiting for data/)).toBeTruthy();
  });
});
