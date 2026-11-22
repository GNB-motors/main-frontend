import { describe, expect, it } from 'vitest';
import { POI_LABEL_STYLES } from './mapLabelStyles';

const styleFor = (featureType) =>
  POI_LABEL_STYLES.find((style) => style.featureType === featureType);

describe('POI_LABEL_STYLES', () => {
  it('shows Google businesses in full so a truck stop has a name', () => {
    const business = styleFor('poi.business');
    expect(business.elementType).toBe('all');
    expect(business.stylers).toEqual([{ visibility: 'on' }]);
  });

  it('keeps the clutter categories off', () => {
    expect(styleFor('poi.attraction').stylers).toEqual([{ visibility: 'off' }]);
    expect(styleFor('poi.sports_complex').stylers).toEqual([{ visibility: 'off' }]);
  });
});
