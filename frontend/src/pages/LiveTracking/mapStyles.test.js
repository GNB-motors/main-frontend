import { describe, it, expect } from 'vitest';
import { LIGHT_MAP_STYLE, DARK_MAP_STYLE } from './mapStyles';

/**
 * The owner's complaint was that our map looked empty next to Google Maps.
 * The cause was a rule that hid every `poi` label. These tests stop that
 * coming back by accident.
 */
describe('map styles', () => {
  const styles = [
    ['LIGHT_MAP_STYLE', LIGHT_MAP_STYLE],
    ['DARK_MAP_STYLE', DARK_MAP_STYLE],
  ];

  it.each(styles)('%s does not hide every poi label', (_name, style) => {
    const hidesAllPois = style.some(
      (rule) => rule.featureType === 'poi' && rule.stylers?.some((s) => s.visibility === 'off'),
    );
    expect(hidesAllPois).toBe(false);
  });

  it.each(styles)('%s keeps the labels a driver needs', (_name, style) => {
    const types = style.map((rule) => rule.featureType);
    expect(types).toContain('poi.medical');
    expect(types).toContain('poi.school');
    expect(types).toContain('poi.government');
  });
});
