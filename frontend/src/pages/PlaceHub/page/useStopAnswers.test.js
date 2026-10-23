import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { toast } from 'react-toastify';
import PlaceHubService from '../PlaceHubService.js';
import useStopAnswers from './useStopAnswers';

vi.mock('react-toastify', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('../PlaceHubService.js', () => ({ default: { tagStop: vi.fn() } }));

describe('useStopAnswers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    PlaceHubService.tagStop.mockResolvedValue({});
  });

  it('saves every stop, confirms with the purpose label and reloads', async () => {
    const loadStops = vi.fn(async () => {});
    const loadPlaces = vi.fn();
    const { result } = renderHook(() => useStopAnswers({ loadStops, loadPlaces }));
    await act(() => result.current.answerStops([{ _id: 'b1' }, { _id: 'b2' }], 'REST'));
    expect(PlaceHubService.tagStop).toHaveBeenCalledTimes(2);
    expect(toast.success).toHaveBeenCalledWith('2 stops marked as rest / meal');
    expect(loadPlaces).toHaveBeenCalled();
  });

  // A purpose without a label used to throw after the stops were saved, turning
  // a successful save into "Could not save the answer".
  it('still reports success for a purpose it has no label for', async () => {
    const loadStops = vi.fn(async () => {});
    const loadPlaces = vi.fn();
    const { result } = renderHook(() => useStopAnswers({ loadStops, loadPlaces }));
    await act(() => result.current.answerStops([{ _id: 'b1' }], 'PARKING'));
    expect(toast.error).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Stop marked as parking');
    expect(loadPlaces).toHaveBeenCalled();
  });
});
