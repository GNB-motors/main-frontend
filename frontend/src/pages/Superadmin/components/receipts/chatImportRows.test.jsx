import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import ReceiptRow from './ReceiptRow';

/**
 * A chat-import row: a fuel photo a driver sent in a WhatsApp chat.
 * It reaches the same inbox as a guided receipt, so it looks like the others
 * and says what is still unsure about it.
 */
const chatRow = {
  _id: 'c1',
  status: 'READY',
  source: 'CHAT_IMPORT',
  vehicleReg: 'WB25R9540',
  plateText: 'WB25R9540',
  litres: 120,
  rate: 89.5,
  amount: 10740,
  phoneE164: '+919876543210',
  createdAt: '2026-11-10T10:00:00Z',
  truck: {
    status: 'AMBIGUOUS',
    bucket: 'AMBIGUOUS',
    plate: 'WB25R9540',
    vehicleId: null,
    candidates: [],
    source: 'CHAT',
  },
  time: {
    predicted: {
      at: '2026-11-10T13:10:00.000Z', // 6:40 pm in India
      source: 'SENSOR_RISE',
      evidence: { sensor: { litres: 120 } },
    },
  },
};

const renderRow = (d) =>
  render(
    <table>
      <tbody>
        <ReceiptRow
          d={d}
          selectedIds={new Set()}
          setActiveDrawerId={() => {}}
          toggleSelectOne={() => {}}
          setPreviewImage={() => {}}
          handleSingleApprove={() => {}}
        />
      </tbody>
    </table>,
  );

describe('ReceiptRow — a chat-import row', () => {
  it('says it came from a chat and that the truck is not identified', () => {
    renderRow(chatRow);

    expect(screen.getByText('From chat')).toBeInTheDocument();
    expect(screen.getByText('Truck not identified')).toBeInTheDocument();
  });

  it('shows the predicted time when the photo has no time of its own', () => {
    renderRow(chatRow);

    expect(screen.getByText('Predicted 10 Nov, 6:40 pm (tank rise)')).toBeInTheDocument();
    expect(screen.queryByText('Fill time not read from the photo.')).not.toBeInTheDocument();
  });

  it('shows the time read from the photo when there is one', () => {
    renderRow({ ...chatRow, time: { value: '2026-11-10T08:30:00.000Z' } });

    expect(screen.queryByText('Predicted 10 Nov, 6:40 pm (tank rise)')).not.toBeInTheDocument();
    expect(screen.getByText(/10 Nov/)).toBeInTheDocument();
    expect(screen.getByText('Source not recorded')).toBeInTheDocument();
  });

  it('says plainly that there is no time on the photo', () => {
    renderRow({ ...chatRow, time: {} });

    expect(screen.getByText('Fill time not read from the photo.')).toBeInTheDocument();
  });

  it('names the sender and keeps the driver apart from them', () => {
    renderRow(chatRow);

    expect(screen.getByText('Uploaded by +919876543210')).toBeInTheDocument();
    expect(screen.getByText('Driver: —')).toBeInTheDocument();
  });

  it('shows the market truck chip for a truck that is not in the fleet', () => {
    renderRow({ ...chatRow, market: true });

    expect(screen.getByText('Market truck')).toBeInTheDocument();
  });

  it('says the truck is only a guess when several trucks fit', () => {
    renderRow({
      ...chatRow,
      truck: { ...chatRow.truck, candidates: [{ vehicleId: 'v1' }, { vehicleId: 'v2' }] },
    });

    expect(screen.getByText('Guess')).toBeInTheDocument();
    expect(screen.queryByText('Truck not identified')).not.toBeInTheDocument();
  });

  it('says the truck is certain when the matcher was sure', () => {
    renderRow({ ...chatRow, truck: { ...chatRow.truck, bucket: 'EXACT' } });

    expect(screen.getByText('Sure')).toBeInTheDocument();
  });

  it('leaves a guided row the way it was', () => {
    renderRow({
      _id: 'g1',
      status: 'READY',
      vehicleReg: 'WB01AB1234',
      litres: 100,
      rate: 90,
      amount: 9000,
      billDatetime: '2026-11-09T10:00:00Z',
      createdAt: '2026-11-09T10:05:00Z',
    });

    expect(screen.queryByText('From chat')).not.toBeInTheDocument();
    expect(screen.queryByText('Truck not identified')).not.toBeInTheDocument();
    expect(screen.queryByText('Market truck')).not.toBeInTheDocument();
    expect(screen.queryByText('Fill time not read from the photo.')).not.toBeInTheDocument();
    expect(screen.getByText('Printed bill')).toBeInTheDocument();
  });
});

describe('ReceiptRow — what the server knows about the fill', () => {
  it('names the driver assigned to the truck', () => {
    renderRow({
      ...chatRow,
      driverAssigned: { driverId: 'd1', name: 'Ramesh', source: 'ASSIGNMENT' },
    });

    expect(screen.getByText('Driver: Ramesh · assigned')).toBeInTheDocument();
  });

  it('shows the pump of the fill and where it came from', () => {
    renderRow({
      ...chatRow,
      pump: { name: 'Jhargram Pump 3', lat: 23.5, lng: 87.1, source: 'DETECTED_FILL' },
    });

    expect(screen.getByText('Jhargram Pump 3')).toBeInTheDocument();
    expect(screen.getByText("Source: truck's detected fill")).toBeInTheDocument();
  });

  it('shows the station name when there is no pump', () => {
    renderRow({ ...chatRow, stationName: 'IOCL Highway Service' });

    expect(screen.getByText('IOCL Highway Service')).toBeInTheDocument();
    expect(screen.getByText('Source: photo')).toBeInTheDocument();
  });

  it('shows the mileage over the last fills of the truck', () => {
    renderRow({
      ...chatRow,
      mileage: {
        computed: 3.4,
        trend: {
          from: '2026-11-01',
          to: '2026-11-10',
          fills: 5,
          km: 460,
          litres: 160,
          kmpl: 2.9,
          usual: 3.1,
          usualSource: 'CYCLES',
          deltaPct: -6.5,
          verdict: 'low',
        },
      },
    });

    expect(
      screen.getByText(
        'Mileage, last 5 fills (1 Nov–10 Nov): 2.9 km/L · usual 3.1 · low: 6.5% below usual — watch this truck',
      ),
    ).toBeInTheDocument();
  });

  it('never judges a single fill on its own', () => {
    renderRow({ ...chatRow, mileage: { computed: 3.4 } });

    expect(screen.queryByText(/km\/L/)).not.toBeInTheDocument();
  });

  it('flags an unusual refill and says why in the chip', () => {
    renderRow({
      ...chatRow,
      refillCheck: { unusual: true, reasons: ['Litres are far more than the tank takes'] },
    });

    const chip = screen.getByText('Unusual refill');
    expect(chip).toBeInTheDocument();
    expect(chip.getAttribute('title')).toBe('Litres are far more than the tank takes');
  });

  it('shows no refill flag when the refill is a usual one', () => {
    renderRow({ ...chatRow, refillCheck: { unusual: false, reasons: [] } });

    expect(screen.queryByText('Unusual refill')).not.toBeInTheDocument();
  });

  it('never gives a photo chip to a reading that did not come from a photo', () => {
    renderRow({
      ...chatRow,
      odometerReading: 154200,
      odometerSource: 'DETECTED_FILL',
    });

    expect(screen.queryByText('Dash Photo OCR')).not.toBeInTheDocument();
    expect(screen.getByText("Source: truck's detected fill")).toBeInTheDocument();
  });
});
