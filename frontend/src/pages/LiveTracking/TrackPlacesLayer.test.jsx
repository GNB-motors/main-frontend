import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { MarkerClustererF } from '@react-google-maps/api';
import TrackPlacesLayer from './TrackPlacesLayer.jsx';
import { CLUSTER_STYLES_DARK, CLUSTER_STYLES_LIGHT } from '../PlaceHub/map/clusterer.js';

vi.mock('@react-google-maps/api', () => ({ MarkerClustererF: vi.fn(() => null) }));
vi.mock('../PlaceHub/map/PlaceShape.jsx', () => ({ default: () => null }));
vi.mock('../PlaceHub/map/PlaceMarker.jsx', () => ({ default: () => null }));
vi.mock('../PlaceHub/map/ClusterRepaint.jsx', () => ({ default: () => null }));

describe('TrackPlacesLayer cluster options', () => {
  it.each([[false, CLUSTER_STYLES_LIGHT], [true, CLUSTER_STYLES_DARK]])(
    'provides the current styles when constructing the clusterer (dark: %s)',
    (dark, styles) => {
      render(<TrackPlacesLayer places={[{ id: 'p1' }]} zoom={8} dark={dark} />);
      expect(MarkerClustererF).toHaveBeenLastCalledWith(
        expect.objectContaining({ options: expect.objectContaining({ styles }) }),
        undefined,
      );
    },
  );
});
