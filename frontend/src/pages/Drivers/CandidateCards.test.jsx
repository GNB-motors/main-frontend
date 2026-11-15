import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import CandidateCards from './CandidateCards';
import { matchLabels } from './candidateMatch';

afterEach(cleanup);

describe('candidate cards', () => {
  it('names the fields the server says agreed, in either spelling', () => {
    expect(matchLabels(['same_phone', 'similar_name', 'same_licence', 'same_aadhaar'])).toEqual([
      'Mobile',
      'Name',
      'DL',
      'Aadhaar',
    ]);
    expect(matchLabels(['name', 'phone', 'same_phone'])).toEqual(['Name', 'Mobile']);
    expect(matchLabels(['checksum', undefined])).toEqual([]);
    expect(matchLabels(undefined)).toEqual([]);
  });

  it('shows only the last four digits of a phone', () => {
    render(
      <CandidateCards
        name="c"
        value=""
        onChange={vi.fn()}
        candidates={[
          { userId: 'u1', name: 'Ram Das', phone: '9876543210', matched: ['same_phone'] },
        ]}
      />,
    );
    expect(screen.getByText('Phone ending 3210')).toBeInTheDocument();
    expect(screen.queryByText(/9876543210/)).not.toBeInTheDocument();
    expect(screen.getByText('Mobile matches')).toBeInTheDocument();
  });
});
