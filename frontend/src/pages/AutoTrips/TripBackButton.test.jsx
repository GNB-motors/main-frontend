import { expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TripBackButton from './TripBackButton';
import PlaceQuestionCard from './PlaceQuestionCard';

it('returns from a sample trip to the same filtered place review view', () => {
  const url = '/auto-trips?tab=questions&status=NEEDS_REVIEW&range=7d&vehicleId=truck1';
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route
          path="/auto-trips"
          element={
            <PlaceQuestionCard
              canAnswer={false}
              question={{
                id: 'q1',
                sampleTrips: [{ to: '/auto-trips/trip1', label: 'Open sample trip' }],
              }}
            />
          }
        />
        <Route path="/auto-trips/:id" element={<TripBackButton />} />
      </Routes>
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole('link', { name: 'Open sample trip' }));
  expect(screen.getByRole('link', { name: 'Back to trips' })).toHaveAttribute('href', url);
});

it('keeps trip filters when the detail was opened without review navigation state', () => {
  render(
    <MemoryRouter
      initialEntries={['/auto-trips/trip1?range=7d&status=NEEDS_REVIEW&vehicleId=truck1']}
    >
      <TripBackButton />
    </MemoryRouter>,
  );
  expect(screen.getByRole('link', { name: 'Back to trips' })).toHaveAttribute(
    'href',
    '/auto-trips?range=7d&status=NEEDS_REVIEW&vehicleId=truck1',
  );
});
