import { describe, it, expect } from 'vitest';
import source from './renderIconSvg.jsx?raw';

describe('renderIconSvg icons', () => {
  // A path must open with a moveto; the truck's cab outline was missing its "M"
  // and the browser dropped it, drawing a truck without a nose.
  it('starts every path with a moveto command', () => {
    const paths = [...source.matchAll(/\bd="([^"]*)"/g)].map((m) => m[1]);
    expect(paths.length).toBeGreaterThan(10);
    expect(paths.filter((d) => !/^\s*[Mm]/.test(d))).toEqual([]);
  });
});
