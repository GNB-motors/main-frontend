import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import React from 'react';
import ChatProofCard from './ChatProofCard';

/**
 * The row the owner opened: a chat import of an 18 L DEF top-up from a can.
 * The message said "S5962 / Uria 18 liter" and the photo could not be read.
 */
const wb11s5962 = {
  _id: 'd1',
  caption: 'S5962 / Uria 18 liter',
  time: { value: '2026-11-09T04:43:00.000Z', source: 'stamp' },
  checks: { MATH: { status: 'PASS', detail: 'The bill adds up.' } },
  chatProof: {
    sender: '+91 98765 43210',
    sentAt: '2026-11-09T04:43:00.000Z',
    text: 'S5962 / Uria 18 liter',
    textRead: {
      truck: 'WB11S5962',
      litresClaim: null,
      defLitres: 18,
      km: null,
      mileage: null,
      notRead: ['The amount was not in the message'],
    },
    photoRead: {
      kind: 'UNKNOWN',
      docKind: null,
      kindConfidence: 0.2,
      stamp: '2026-11-09T04:43:00.000Z',
      litres: null,
      rate: null,
      amount: null,
      plate: null,
    },
    pipelineSaid: 'The photo was too dark to read.',
  },
};

describe('ChatProofCard — spec 1: the card only appears with proof', () => {
  it('shows nothing when the row carries no chat proof', () => {
    const { container } = render(<ChatProofCard draft={{ _id: 'd1' }} />);
    expect(container.firstChild).toBeNull();
    expect(screen.queryByText('Proof from the chat')).toBeNull();
  });

  it('shows nothing when the chat proof is not an object', () => {
    const { container } = render(<ChatProofCard draft={{ chatProof: null }} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows the card when the row carries chat proof', () => {
    render(<ChatProofCard draft={wb11s5962} />);
    expect(screen.getByText('Proof from the chat')).toBeTruthy();
  });
});

describe('ChatProofCard — spec 2: the message exactly as it was sent', () => {
  it('keeps the line break inside the message', () => {
    const draft = {
      ...wb11s5962,
      chatProof: { ...wb11s5962.chatProof, text: 'S5962\nUria 18 liter' },
    };
    const { container } = render(<ChatProofCard draft={draft} />);

    const message = container.querySelector('.ra-caption');
    expect(message.textContent).toBe('S5962\nUria 18 liter');
  });

  it('shows a tag in the message as plain text, never as markup', () => {
    const draft = {
      ...wb11s5962,
      chatProof: { ...wb11s5962.chatProof, text: 'S5962 <b>bold</b> 18 liter' },
    };
    const { container } = render(<ChatProofCard draft={draft} />);

    const message = container.querySelector('.ra-caption');
    expect(message.textContent).toBe('S5962 <b>bold</b> 18 liter');
    expect(message.querySelector('b')).toBeNull();
  });

  it('names the sender and the time the message was sent, in India time', () => {
    render(<ChatProofCard draft={wb11s5962} />);
    expect(screen.getByText('From +91 98765 43210')).toBeTruthy();
    expect(screen.getByText('Message sent: 09 Nov, 10:13')).toBeTruthy();
  });
});

describe('ChatProofCard — spec 3 and 4: what we read and what the photo showed', () => {
  it('shows the DEF claim and leaves out what the message did not say', () => {
    render(<ChatProofCard draft={wb11s5962} />);

    expect(screen.getByText('DEF / urea 18 L')).toBeTruthy();
    expect(screen.getByText('WB11S5962')).toBeTruthy();
    // A missing number is left out, never shown as a zero.
    expect(screen.queryByText(/^0 L$/)).toBeNull();
    expect(screen.queryByText('0 km')).toBeNull();
  });

  it('says that the photo was not a pump screen or bill we could read', () => {
    render(<ChatProofCard draft={wb11s5962} />);

    expect(
      screen.getByText('Photo type unknown: not a pump screen or bill we could read'),
    ).toBeTruthy();
    expect(screen.getByText('Camera stamp: 09 Nov, 10:13')).toBeTruthy();
  });

  it('says "not a pump screen or bill" for a known other kind of photo', () => {
    const draft = {
      ...wb11s5962,
      chatProof: {
        ...wb11s5962.chatProof,
        photoRead: { ...wb11s5962.chatProof.photoRead, kind: 'DASHBOARD' },
      },
    };
    render(<ChatProofCard draft={draft} />);

    expect(screen.getByText('Not a pump screen or bill')).toBeTruthy();
  });

  it('says that the photo details are unavailable when there is no photo read', () => {
    const draft = {
      ...wb11s5962,
      chatProof: { ...wb11s5962.chatProof, photoRead: null },
    };
    render(<ChatProofCard draft={draft} />);

    expect(screen.getByText('Photo details unavailable')).toBeTruthy();
  });

  it('lists the litres, rate, amount and plate of a pump screen or bill', () => {
    const draft = {
      ...wb11s5962,
      chatProof: {
        ...wb11s5962.chatProof,
        photoRead: {
          kind: 'PUMP',
          docKind: 'PUMP_RECEIPT',
          kindConfidence: 'HIGH',
          stamp: '2026-11-09T04:43:00.000Z',
          litres: 120,
          rate: 89.5,
          amount: 10740,
          plate: 'WB11S5999',
        },
      },
    };
    render(<ChatProofCard draft={draft} />);

    // The plate of the photo is its own, and it belongs to the photo.
    const photo = screen.getByText('What the photo showed').closest('.ra-proof-section');
    expect(within(photo).getByText('WB11S5999')).toBeTruthy();
    expect(within(photo).queryByText('WB11S5962')).toBeNull();
    expect(within(photo).getByText('120 L')).toBeTruthy();
    expect(within(photo).getByText('₹89.5/L')).toBeTruthy();
    expect(within(photo).getByText('₹10,740')).toBeTruthy();
    expect(within(photo).getByText(/PUMP_RECEIPT/)).toBeTruthy();
    expect(within(photo).getByText(/confidence HIGH/)).toBeTruthy();

    // The truck of the message stays in the part that read the message.
    const read = screen.getByText('What we read from the message').closest('.ra-proof-section');
    expect(within(read).getByText('WB11S5962')).toBeTruthy();
  });

  it('keeps a diesel claim and a DEF claim on separate lines', () => {
    const draft = {
      ...wb11s5962,
      chatProof: {
        ...wb11s5962.chatProof,
        textRead: { ...wb11s5962.chatProof.textRead, litresClaim: 100, defLitres: 18 },
      },
    };
    render(<ChatProofCard draft={draft} />);

    expect(screen.getByText('Diesel 100 L')).toBeTruthy();
    expect(screen.getByText('DEF / urea 18 L')).toBeTruthy();
  });

  it('lists what was not understood and any other fluid claimed', () => {
    const draft = {
      ...wb11s5962,
      chatProof: {
        ...wb11s5962.chatProof,
        textRead: {
          ...wb11s5962.chatProof.textRead,
          fluidClaims: ['distilled water'],
        },
      },
    };
    render(<ChatProofCard draft={draft} />);

    expect(screen.getByText('Not understood')).toBeTruthy();
    expect(screen.getByText('The amount was not in the message')).toBeTruthy();
    expect(screen.getByText('distilled water')).toBeTruthy();
  });
});

describe('ChatProofCard — spec 3 and 4: a number that was never read', () => {
  it('leaves out a blank number instead of showing a zero', () => {
    const draft = {
      ...wb11s5962,
      chatProof: {
        ...wb11s5962.chatProof,
        textRead: {
          ...wb11s5962.chatProof.textRead,
          litresClaim: ' ',
          defLitres: ' ',
          km: ' ',
          mileage: ' ',
        },
        photoRead: { kind: 'PUMP', amount: ' ' },
      },
    };
    render(<ChatProofCard draft={draft} />);

    expect(screen.queryByText(/Diesel/)).toBeNull();
    expect(screen.queryByText(/DEF \/ urea/)).toBeNull();
    expect(screen.queryByText('Kilometres')).toBeNull();
    expect(screen.queryByText('Mileage')).toBeNull();
    expect(screen.queryByText('Amount')).toBeNull();
    expect(screen.queryByText(/0 L/)).toBeNull();
  });

  it('does not read a boolean, a list or nothing as a number', () => {
    const draft = {
      ...wb11s5962,
      chatProof: {
        ...wb11s5962.chatProof,
        textRead: {
          ...wb11s5962.chatProof.textRead,
          litresClaim: true,
          defLitres: [],
          km: null,
          mileage: undefined,
        },
        photoRead: { kind: 'PUMP', litres: NaN, rate: false, amount: {} },
      },
    };
    render(<ChatProofCard draft={draft} />);

    expect(screen.queryByText(/Diesel/)).toBeNull();
    expect(screen.queryByText(/DEF \/ urea/)).toBeNull();
    expect(screen.queryByText('Kilometres')).toBeNull();
    expect(screen.queryByText('Mileage')).toBeNull();
    expect(screen.queryByText('Litres')).toBeNull();
    expect(screen.queryByText('Rate')).toBeNull();
    expect(screen.queryByText('Amount')).toBeNull();
  });
});

describe('ChatProofCard — spec 5: what our own data showed', () => {
  it('lists the checks with their result and detail', () => {
    render(<ChatProofCard draft={wb11s5962} />);

    expect(screen.getByText('MATH: PASS — The bill adds up.')).toBeTruthy();
  });

  it('reads the checks when they come as an array', () => {
    const draft = {
      ...wb11s5962,
      checks: [
        { name: 'LITRES', result: 'fail', detail: 'The photo says 12 L.' },
        { name: 'TRUCK', result: 'unknown', detail: 'No truck in the message.' },
      ],
    };
    render(<ChatProofCard draft={draft} />);

    expect(screen.getByText('LITRES: FAIL — The photo says 12 L.')).toBeTruthy();
    // An unknown check is never shown as a pass.
    expect(screen.getByText('TRUCK: UNKNOWN — No truck in the message.')).toBeTruthy();
    expect(screen.queryByText(/^0:/)).toBeNull();
  });

  it('shows a failed result for a check that only says ok: false', () => {
    const draft = { ...wb11s5962, checks: { MATH: { ok: false, detail: 'Mismatch' } } };
    render(<ChatProofCard draft={draft} />);

    expect(screen.getByText('MATH: FAIL — Mismatch')).toBeTruthy();
  });

  it('shows unknown when one field says unknown and another says pass', () => {
    const draft = {
      ...wb11s5962,
      checks: [{ name: 'TRUCK', result: 'unknown', ok: true, detail: 'No truck.' }],
    };
    render(<ChatProofCard draft={draft} />);

    expect(screen.getByText('TRUCK: UNKNOWN — No truck.')).toBeTruthy();
  });

  it('shows the fill time and the system note', () => {
    render(<ChatProofCard draft={wb11s5962} />);

    expect(screen.getByText('Fill time')).toBeTruthy();
    expect(screen.getByText('09 Nov, 10:13')).toBeTruthy();
    expect(screen.getByText('System note: The photo was too dark to read.')).toBeTruthy();
  });
});
