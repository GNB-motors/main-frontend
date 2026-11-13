import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import DrawerDetailsPane from './DrawerDetailsPane';
import { predictedTimeText } from './predictedTime';

const draftWith = (time) => ({
  _id: 'd1',
  vehicleReg: 'WB11AB1234',
  litres: 100,
  rate: 90,
  amount: 9000,
  billDatetime: null,
  createdAt: '2026-11-10T10:00:00Z',
  time,
});

const props = {
  ocrEval: { math: { isValid: true, diff: 0 } },
  veh: 'WB11AB1234',
  odoMeta: { displayReading: '1200 km', badgeClass: '', badgeText: 'ok', detailHint: 'from the photo' },
  stationInfo: {
    stationName: 'Jhargram Pump',
    coordinates: null,
    haltTime: null,
    isGeofenceMatch: null,
    benchmarkRate: null,
    benchmarkPlace: null,
    benchmarkEffectiveDate: null,
    billRate: 90,
  },
};

const PREDICTED = {
  at: '2026-11-10T13:10:00.000Z', // 6:40 pm in India
  source: 'SENSOR_RISE',
  confidence: 'MEDIUM',
  evidence: { sensor: { litres: 100 } },
};

/** Open one of the folding sections of the drawer. */
const openSection = (name) => {
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${name}`) }));
};

describe('DrawerDetailsPane — the key facts', () => {
  it('shows the facts of the fill in one small card', () => {
    render(
      <DrawerDetailsPane
        {...props}
        draft={draftWith({ value: '2026-11-10T13:10:00.000Z', source: 'stamp' })}
      />,
    );

    ['Truck', 'Litres', 'Amount', 'Rate', 'Fill time', 'Odometer', 'Pump', 'Driver', 'Mileage'].forEach(
      (label) => {
        expect(screen.getByText(label)).toBeTruthy();
      },
    );
  });

  it('shows the driver assigned to the truck, and since when', () => {
    render(
      <DrawerDetailsPane
        {...props}
        draft={{
          ...draftWith({}),
          driverAssigned: {
            driverId: 'd1',
            name: 'Ramesh',
            source: 'ASSIGNMENT',
            since: '2026-01-05T00:00:00.000Z',
          },
        }}
      />,
    );

    expect(screen.getByText('Ramesh · assigned')).toBeTruthy();
    expect(screen.getByText(/Assigned since/)).toBeTruthy();
  });

  it('shows a dash when no driver is known', () => {
    render(<DrawerDetailsPane {...props} draft={draftWith({})} />);

    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('shows the pump and where the pump came from', () => {
    render(
      <DrawerDetailsPane
        {...props}
        draft={{
          ...draftWith({}),
          pump: { name: 'Jhargram Pump 3', lat: 23.5, lng: 87.1, source: 'DETECTED_FILL' },
        }}
      />,
    );

    expect(screen.getByText('Jhargram Pump 3')).toBeTruthy();
    expect(screen.getByText("Source: truck's detected fill")).toBeTruthy();
  });

  it('shows the mileage against the usual of that truck', () => {
    render(
      <DrawerDetailsPane
        {...props}
        draft={{
          ...draftWith({}),
          mileage: {
            computed: 3.4,
            vsAverage: {
              average: 3.9,
              n: 8,
              source: 'FLEETEDGE',
              deltaPct: 12,
              verdict: 'worse',
            },
          },
        }}
      />,
    );

    expect(
      screen.getByText("3.4 km/L · 12% below this truck's usual 3.9 (8 fills)"),
    ).toBeTruthy();
    expect(screen.getByText('Source: tracker')).toBeTruthy();
  });

  it('never invents a comparison that was not measured', () => {
    render(
      <DrawerDetailsPane
        {...props}
        draft={{ ...draftWith({}), mileage: { computed: 3.4 } }}
      />,
    );

    expect(screen.getByText('3.4 km/L · Comparison not available')).toBeTruthy();
  });
});

describe('DrawerDetailsPane — the folding sections', () => {
  it('starts every section closed, with a summary in the header', () => {
    render(<DrawerDetailsPane {...props} draft={draftWith({})} />);

    const checks = screen.getByRole('button', { name: /^Checks/ });
    expect(checks.tagName).toBe('BUTTON');
    expect(checks.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByRole('button', { name: 'Checks · Not checked' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Predictions · No suggestions' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Station details · Jhargram Pump' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Audit · Uploader unknown' })).toBeTruthy();
  });

  it('opens a section and says that it is open', () => {
    render(<DrawerDetailsPane {...props} draft={draftWith({})} />);

    const checks = screen.getByRole('button', { name: /^Checks/ });
    fireEvent.click(checks);

    expect(checks.getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByText('Math Verified')).toBeTruthy();
    expect(screen.getAllByText('1200 km').length).toBeGreaterThan(0);
  });

  it('says how many truck suggestions there are', () => {
    render(
      <DrawerDetailsPane
        {...props}
        draft={{
          ...draftWith({}),
          truck: {
            bucket: 'AMBIGUOUS',
            candidates: [{ vehicleId: 'v1' }, { vehicleId: 'v2' }],
          },
        }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Predictions · 2 truck suggestions' })).toBeTruthy();
  });

  it('says that a check needs a look', () => {
    render(
      <DrawerDetailsPane
        {...props}
        draft={{
          ...draftWith({}),
          checks: { MATH: { status: 'FAIL', detail: 'The amount is not the litres times the rate.' } },
        }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Checks · 1 needs a look' })).toBeTruthy();
  });
});

describe('DrawerDetailsPane — the predicted fill time', () => {
  it('shows the predicted time in plain words, never as a read time', () => {
    render(<DrawerDetailsPane {...props} draft={draftWith({ predicted: PREDICTED })} />);
    openSection('Predictions');

    expect(screen.getByText('Predicted 10 Nov, 6:40 pm (tank rise, one clue)')).toBeTruthy();
    // The read time of the photo is still unknown.
    openSection('Audit');
    expect(screen.getByText('Bill Date & Time')).toBeTruthy();
    expect(screen.getByText('Fill time not read from the photo.')).toBeTruthy();
  });

  it('offers the suggested time and a way to set another', () => {
    const onSetTime = vi.fn();
    render(
      <DrawerDetailsPane
        {...props}
        draft={draftWith({ predicted: PREDICTED })}
        onSetTime={onSetTime}
      />,
    );
    openSection('Predictions');

    fireEvent.click(screen.getByRole('button', { name: 'Use suggested time' }));
    expect(onSetTime).toHaveBeenCalledWith('accept');

    fireEvent.click(screen.getByRole('button', { name: 'Set time' }));
    expect(screen.getByLabelText('Time of the fill')).toBeTruthy();
  });

  it('sends the time the person typed', () => {
    const onSetTime = vi.fn();
    render(
      <DrawerDetailsPane
        {...props}
        draft={draftWith({ predicted: PREDICTED })}
        onSetTime={onSetTime}
      />,
    );
    openSection('Predictions');

    fireEvent.click(screen.getByRole('button', { name: 'Set time' }));
    fireEvent.change(screen.getByLabelText('Time of the fill'), {
      target: { value: '2026-11-10T18:15' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSetTime).toHaveBeenCalledWith('set', new Date('2026-11-10T18:15').toISOString());
  });

  it('shows nothing about a time when there is no prediction', () => {
    render(<DrawerDetailsPane {...props} draft={draftWith({ predicted: null })} />);

    expect(screen.queryByText(/Predicted/)).toBeNull();
    expect(screen.queryByRole('button', { name: 'Use suggested time' })).toBeNull();
  });

  it('shows how we know, so that a person can check it', () => {
    const draft = draftWith({
      predicted: {
        ...PREDICTED,
        evidence: {
          truckStatus: 'likely',
          sensor: {
            at: '2026-11-10T13:10:00.000Z',
            litres: 100,
            pumpName: 'Jhargram Pump',
          },
          gps: {
            at: '2026-11-10T13:05:00.000Z',
            until: '2026-11-10T13:12:00.000Z',
            fixes: 3,
            radiusM: 500,
            place: { id: 'p1', name: 'Jhargram Pump' },
          },
        },
      },
    });
    render(<DrawerDetailsPane {...props} draft={draft} />);
    openSection('Predictions');

    expect(screen.getByText('Tank rise at Jhargram Pump of 100 L at 6:40 pm.')).toBeTruthy();
    expect(
      screen.getByText('At Jhargram Pump from 6:35 pm to 6:42 pm, 3 readings within 500 m.'),
    ).toBeTruthy();
    expect(
      screen.getByText('The truck itself is only likely, so a person has to pick it.'),
    ).toBeTruthy();
    expect(screen.getByText('Predicted 10 Nov, 6:40 pm (tank rise, one clue, likely truck)')).toBeTruthy();
  });

  it('names the source of every prediction', () => {
    expect(predictedTimeText(PREDICTED)).toBe('Predicted 10 Nov, 6:40 pm (tank rise, one clue)');
    expect(predictedTimeText({ ...PREDICTED, source: 'GPS_AT_PUMP' })).toBe(
      'Predicted 10 Nov, 6:40 pm (GPS at pump, one clue)',
    );
    expect(predictedTimeText({ ...PREDICTED, source: 'BOTH' })).toBe(
      'Predicted 10 Nov, 6:40 pm (tank rise and GPS at pump, one clue)',
    );
  });
});

describe('DrawerDetailsPane — the facts a draft carries', () => {
  it('shows the fill time and where it came from', () => {
    render(
      <DrawerDetailsPane
        {...props}
        draft={draftWith({ value: '2026-11-10T13:10:00.000Z', source: 'stamp' })}
      />,
    );

    expect(screen.getByText('10 Nov, 6:40 pm')).toBeTruthy();
    expect(screen.getAllByText('Source: photo').length).toBeGreaterThan(0);
    // The server decided this year from the stamp: no warning.
    expect(screen.queryByText('year not confirmed — check the bill')).toBeNull();
  });

  it('warns when only the printed bill date is known', () => {
    render(
      <DrawerDetailsPane
        {...props}
        draft={{ ...draftWith(null), billDatetime: '2026-11-10T13:10:00.000Z' }}
      />,
    );

    expect(screen.getByText('Source: printed bill')).toBeTruthy();
    expect(screen.getByText('year not confirmed — check the bill')).toBeTruthy();
  });

  it('says what the station does not tell us', () => {
    render(<DrawerDetailsPane {...props} draft={draftWith({})} />);
    openSection('Station details');

    expect(screen.queryByText('Station not read from the photo.')).toBeNull();
    expect(screen.queryByText('Pump GPS Coordinates')).toBeNull();
    expect(screen.getByText('Halt duration not available.')).toBeTruthy();
    expect(screen.getByText('Location match not checked.')).toBeTruthy();
    expect(screen.getByText('Benchmark not available')).toBeTruthy();
  });

  it('keeps the sender and the driver apart', () => {
    render(<DrawerDetailsPane {...props} draft={draftWith({})} />);
    openSection('Audit');

    expect(screen.getByText('Uploaded by')).toBeTruthy();
    expect(screen.getAllByText('Driver').length).toBeGreaterThan(0);
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('calls the caption the sender’s message when no driver is known', () => {
    render(<DrawerDetailsPane {...props} draft={{ ...draftWith({}), caption: 'Filled up' }} />);
    openSection('Audit');

    expect(screen.getByText('Message from the sender')).toBeTruthy();
  });
});
