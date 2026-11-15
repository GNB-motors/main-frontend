import { describe, it, expect } from 'vitest';
import {
  LAYER_MIN_ZOOM,
  PLACE_LAYERS,
  defaultLayerSelection,
  defaultStatusSelection,
  filterBySelection,
  isAllSelected,
  isZoomGated,
  layersForZoom,
  legendMakeRows,
  legendStatusRows,
  selectOnly,
  toggleSelection,
} from './trackLegendModel';

describe('default selections', () => {
  it('starts every truck status on', () => {
    const selection = defaultStatusSelection();
    expect(selection).toEqual({ moving: true, idling: true, stopped: true, offline: true });
  });

  it('starts our places and pumps on, and the rest off', () => {
    const selection = defaultLayerSelection();
    expect(selection.ourPlaces).toBe(true);
    expect(selection.pumps).toBe(true);
    expect(selection.dhabas).toBe(false);
    expect(selection.hospitals).toBe(false);
  });
});

describe('toggleSelection', () => {
  it('turns a row off and back on', () => {
    const start = defaultStatusSelection();
    const off = toggleSelection(start, 'moving');
    expect(off.moving).toBe(false);
    expect(toggleSelection(off, 'moving').moving).toBe(true);
  });

  it('leaves the other rows alone', () => {
    const off = toggleSelection(defaultStatusSelection(), 'moving');
    expect(off.idling).toBe(true);
    expect(off.stopped).toBe(true);
    expect(off.offline).toBe(true);
  });

  it('ignores a key it does not know', () => {
    const start = defaultStatusSelection();
    expect(toggleSelection(start, 'nope')).toEqual(start);
  });
});

describe('selectOnly', () => {
  it('turns every other row off', () => {
    const only = selectOnly(defaultStatusSelection(), 'idling');
    expect(only).toEqual({ moving: false, idling: true, stopped: false, offline: false });
  });

  it('brings everything back when the only row is clicked again', () => {
    const only = selectOnly(defaultStatusSelection(), 'idling');
    expect(selectOnly(only, 'idling')).toEqual(defaultStatusSelection());
  });
});

describe('isAllSelected', () => {
  it('is true when every row is on', () => {
    expect(isAllSelected(defaultStatusSelection())).toBe(true);
  });

  it('is false as soon as one row is off', () => {
    expect(isAllSelected(toggleSelection(defaultStatusSelection(), 'moving'))).toBe(false);
  });
});

describe('filterBySelection', () => {
  const trucks = [
    { plate: 'A', status: 'moving' },
    { plate: 'B', status: 'idling' },
    { plate: 'C', status: 'offline' },
  ];

  it('keeps only the rows that are on', () => {
    const selection = toggleSelection(defaultStatusSelection(), 'idling');
    const kept = filterBySelection(trucks, selection, (t) => t.status);
    expect(kept.map((t) => t.plate)).toEqual(['A', 'C']);
  });

  it('keeps an item whose key the legend does not know', () => {
    const kept = filterBySelection(trucks, defaultStatusSelection(), () => 'unknown');
    expect(kept).toHaveLength(3);
  });

  it('copes with a missing list', () => {
    expect(filterBySelection(null, defaultStatusSelection(), (t) => t.status)).toEqual([]);
  });
});

describe('legendStatusRows', () => {
  it('shows the full fleet count for each status', () => {
    const rows = legendStatusRows({ moving: 20, idling: 2, stopped: 65, offline: 37 });
    expect(rows.map((row) => row.count)).toEqual([20, 2, 65, 37]);
    expect(rows.map((row) => row.label)).toEqual(['Moving', 'Idling', 'Stopped', 'Offline']);
  });

  it('shows zero rather than nothing when a status has no trucks', () => {
    const rows = legendStatusRows({ moving: 5 });
    expect(rows.find((row) => row.key === 'idling').count).toBe(0);
  });

  it('gives each row a colour', () => {
    const rows = legendStatusRows({});
    expect(rows.every((row) => row.color.startsWith('var(--rd-'))).toBe(true);
  });

  it('uses the same status names the rest of the product uses', () => {
    expect(legendStatusRows({}).map((row) => row.key)).toEqual([
      'moving',
      'idling',
      'stopped',
      'offline',
    ]);
  });
});

describe('legendMakeRows', () => {
  const vehicles = [
    { manufacturer: 'Tata' },
    { manufacturer: 'Tata' },
    { manufacturer: 'Ashok Leyland' },
    { manufacturer: null },
  ];

  it('shows one row per make the fleet has', () => {
    const rows = legendMakeRows(['Tata', 'Ashok Leyland'], vehicles);
    expect(rows.map((row) => row.label)).toEqual(['Tata', 'Ashok Leyland', 'Unclassified']);
    expect(rows.map((row) => row.count)).toEqual([2, 1, 1]);
  });

  it('never invents a make the fleet does not have', () => {
    const rows = legendMakeRows(['Tata'], vehicles);
    expect(rows.map((row) => row.label)).not.toContain('Ashok Leyland');
  });

  it('leaves out the unclassified row when every truck has a make', () => {
    const rows = legendMakeRows(['Tata'], [{ manufacturer: 'Tata' }]);
    expect(rows.map((row) => row.label)).not.toContain('Unclassified');
  });
});

describe('layersForZoom', () => {
  it('always allows our places', () => {
    expect(layersForZoom(7, defaultLayerSelection())).toContain('ourPlaces');
  });

  it('keeps selected place categories available when the map is far out', () => {
    expect(layersForZoom(7, defaultLayerSelection())).toContain('pumps');
  });

  it('allows the zoom-gated layers when zoomed in', () => {
    expect(layersForZoom(LAYER_MIN_ZOOM, defaultLayerSelection())).toContain('pumps');
  });

  it('never asks for a layer that is switched off', () => {
    const selection = toggleSelection(defaultLayerSelection(), 'pumps');
    expect(layersForZoom(14, selection)).not.toContain('pumps');
  });
});

describe('isZoomGated', () => {
  it('does not block dhabas at a regional zoom', () => {
    expect(isZoomGated('dhabas', 9)).toBe(false);
  });

  it('is false for our places at any zoom', () => {
    expect(isZoomGated('ourPlaces', 7)).toBe(false);
  });

  it('is false for an unknown layer', () => {
    expect(isZoomGated('nope', 7)).toBe(false);
  });
});

describe('PLACE_LAYERS', () => {
  it('gives every layer a label and an icon', () => {
    expect(PLACE_LAYERS.every((layer) => layer.label && layer.icon)).toBe(true);
  });
});
