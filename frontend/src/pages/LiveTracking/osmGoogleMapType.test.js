import { describe, expect, it, vi } from 'vitest';
import { installOsmMapType, OSM_MAP_TYPE_ID, osmTileUrl } from './osmGoogleMapType.js';

describe('OSM background inside Google Maps', () => {
  it('uses the shared OSM tile source and wraps horizontal world copies', () => {
    expect(osmTileUrl({ x: 3, y: 2 }, 3)).toBe('https://tile.openstreetmap.org/3/3/2.png');
    expect(osmTileUrl({ x: -1, y: 2 }, 3)).toBe('https://tile.openstreetmap.org/3/7/2.png');
    expect(osmTileUrl({ x: 9, y: 2 }, 3)).toBe('https://tile.openstreetmap.org/3/1/2.png');
  });

  it('does not request tiles beyond the poles or the provider zoom limit', () => {
    expect(osmTileUrl({ x: 0, y: -1 }, 3)).toBeNull();
    expect(osmTileUrl({ x: 0, y: 8 }, 3)).toBeNull();
    expect(osmTileUrl({ x: 0, y: 0 }, 20)).toBeNull();
  });

  it('registers imagery on the existing Google instance and removes it on cleanup', () => {
    const set = vi.fn();
    const map = { mapTypes: { set } };
    const api = {
      Size: class {
        constructor(width, height) {
          Object.assign(this, { width, height });
        }
      },
      ImageMapType: class {
        constructor(options) {
          this.options = options;
        }
      },
    };
    const remove = installOsmMapType(map, api);
    const [id, type] = set.mock.calls[0];
    expect(id).toBe(OSM_MAP_TYPE_ID);
    expect(type.options).toMatchObject({
      minZoom: 0,
      maxZoom: 19,
      tileSize: { width: 256, height: 256 },
    });
    expect(type.options.getTileUrl).toBe(osmTileUrl);
    remove();
    expect(set).toHaveBeenLastCalledWith(OSM_MAP_TYPE_ID, null);
  });
});
