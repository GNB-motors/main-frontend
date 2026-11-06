import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import useTrackTolls, { tollViewBoxes } from './useTrackTolls.js';
import PlaceIntelligenceService from '../PlaceHub/intelligence/PlaceIntelligenceService.js';

vi.mock('../PlaceHub/intelligence/PlaceIntelligenceService.js', () => ({ default: { listTollPlazas: vi.fn() } }));

describe('toll map scope', () => {
  it('covers the whole visible box without exceeding the API six-degree limit', () => {
    const boxes = tollViewBoxes([21, 80, 29, 89], 8);
    expect(boxes).toHaveLength(4);
    expect(boxes[0]).toEqual({ scope: 'all', south: 21, west: 80, north: 27, east: 86 });
    expect(boxes.at(-1)).toEqual({ scope: 'all', south: 27, west: 86, north: 29, east: 89 });
    expect(boxes.every((box) => box.north - box.south <= 6 && box.east - box.west <= 6)).toBe(true);
  });
  it('holds broad or invalid views instead of requesting a partial box', () => {
    expect(tollViewBoxes([6, 68, 38, 98], 5)).toEqual([]);
    expect(tollViewBoxes([21, 90, 25, 80], 9)).toEqual([]);
  });
  it('keeps visited plazas and adds/removes others when scope changes', async () => {
    PlaceIntelligenceService.listTollPlazas.mockImplementation(async ({ scope }) => ({ items: scope === 'visited'
      ? [{ id: 'a', visited: true }] : [{ id: 'a', visited: true }, { id: 'b', visited: false }] }));
    const { result, rerender } = renderHook(({ all }) => useTrackTolls({ enabled: true, showAll: all, bbox: [22, 86, 25, 89], zoom: 8 }), { initialProps: { all: false } });
    await waitFor(() => expect(result.current.visitedCount).toBe(1));
    expect(result.current.plazas.map((p) => p.id)).toEqual(['a']);
    act(() => rerender({ all: true }));
    await waitFor(() => expect(result.current.allCount).toBe(2));
    expect(result.current.plazas.map((p) => p.id)).toEqual(['a', 'b']);
    act(() => rerender({ all: false }));
    expect(result.current.plazas.map((p) => p.id)).toEqual(['a']);
  });
});
