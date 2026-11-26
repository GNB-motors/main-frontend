import { afterEach, describe, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { act, render, screen } from '@testing-library/react';
import { useGoogleMap } from '@react-google-maps/api';
import VectorGoogleMap from './VectorGoogleMap';

afterEach(() => vi.unstubAllGlobals());

function setup() {
  const handlers = {};
  const removers = [];
  const instances = [];
  const createInstance = () => ({
    camera: {},
    mapTypes: { set: vi.fn() },
    setOptions: vi.fn((options) => {
      if ('renderingType' in options)
        throw new Error('renderingType cannot change after instantiation');
    }),
    setCenter: vi.fn(function (center) {
      this.camera.center = center;
    }),
    getCenter() {
      return (
        this.camera.center && {
          lat: () => this.camera.center.lat,
          lng: () => this.camera.center.lng,
        }
      );
    },
    setZoom: vi.fn(function (zoom) {
      this.camera.zoom = zoom;
    }),
    getZoom() {
      return this.camera.zoom;
    },
    setRenderingType: vi.fn(() => {
      throw new Error("Setting map 'renderingType' after instantiation is not supported.");
    }),
    addListener: vi.fn((name, handler) => {
      handlers[name] = handler;
      const remove = vi.fn();
      removers.push(remove);
      return { remove };
    }),
  });
  const instance = createInstance();
  const constructor = vi.fn(function (_container, options) {
    const next = instances.length ? createInstance() : instance;
    next.camera = { ...options };
    instances.push(next);
    return next;
  });
  vi.stubGlobal('google', {
    maps: {
      Map: constructor,
      ImageMapType: class {
        constructor(options) {
          this.options = options;
        }
      },
      Size: class {},
    },
  });
  return { instance, instances, constructor, handlers, removers };
}

describe('vector map lifecycle', () => {
  it('uses OSM normally, keeps Google imagery for 3D and restores OSM afterwards', () => {
    const { constructor, instances } = setup();
    const options = { mapTypeId: 'osm' };
    const { rerender, unmount } = render(
      <VectorGoogleMap osmBasemap options={options} renderingType="RASTER" />,
    );
    expect(constructor.mock.calls[0][1].mapTypeId).toBe('osm');
    expect(instances[0].mapTypes.set.mock.calls[0][0]).toBe('osm');
    rerender(<VectorGoogleMap osmBasemap options={options} renderingType="VECTOR" />);
    expect(constructor.mock.calls[1][1].mapTypeId).toBe('roadmap');
    expect(instances[0].mapTypes.set).toHaveBeenLastCalledWith('osm', null);
    rerender(<VectorGoogleMap osmBasemap options={options} renderingType="RASTER" />);
    expect(constructor.mock.calls[2][1].mapTypeId).toBe('osm');
    unmount();
    expect(instances[2].mapTypes.set).toHaveBeenLastCalledWith('osm', null);
  });

  it('keeps the normal raster map through replay and style changes', () => {
    const { instance, constructor } = setup();
    const center = { lat: 22, lng: 88 };
    const onLoad = vi.fn();
    function Layer() {
      return <output>{useGoogleMap() === instance ? 'Same map' : 'Wrong map'}</output>;
    }
    const { rerender } = render(
      <VectorGoogleMap
        options={{ renderingType: 'VECTOR', mapTypeId: 'roadmap' }}
        center={center}
        zoom={12}
        onLoad={onLoad}
      >
        <Layer />
      </VectorGoogleMap>,
    );
    expect(constructor).toHaveBeenCalledOnce();
    expect(constructor.mock.calls[0][1]).toMatchObject({
      renderingType: 'RASTER',
      center,
      zoom: 12,
    });
    expect(onLoad).toHaveBeenCalledWith(instance);
    expect(screen.getByText('Same map')).toBeInTheDocument();
    expect(instance.setCenter).not.toHaveBeenCalled();
    expect(instance.setZoom).not.toHaveBeenCalled();
    const replayStyles = [{ featureType: 'road', stylers: [{ visibility: 'off' }] }];
    rerender(
      <VectorGoogleMap
        options={{ renderingType: 'VECTOR', styles: replayStyles }}
        center={center}
        zoom={12}
      >
        <Layer />
      </VectorGoogleMap>,
    );
    expect(instance.setOptions).toHaveBeenLastCalledWith({ styles: replayStyles });
    const newCenter = { lat: 23, lng: 89 };
    rerender(
      <VectorGoogleMap options={{ mapTypeId: 'satellite' }} center={newCenter} zoom={16}>
        <Layer />
      </VectorGoogleMap>,
    );
    expect(constructor).toHaveBeenCalledOnce();
    expect(instance.setOptions).toHaveBeenLastCalledWith({ mapTypeId: 'satellite' });
    expect(instance.setCenter).toHaveBeenLastCalledWith(newCenter);
    expect(instance.setZoom).toHaveBeenLastCalledWith(16);
    expect(screen.getByText('Same map')).toBeInTheDocument();
  });

  it('recreates the map only for renderer changes, preserves the view and restores grey styles', () => {
    const { instance, instances, constructor, removers } = setup();
    const styles = [{ elementType: 'geometry', stylers: [{ color: '#f0f3f6' }] }];
    const options = { styles, mapTypeId: 'roadmap' };
    const onLoad = vi.fn();
    const onUnmount = vi.fn();
    function Layer() {
      return <output>{`Map ${instances.indexOf(useGoogleMap()) + 1}`}</output>;
    }
    const { rerender } = render(
      <VectorGoogleMap
        options={options}
        renderingType="RASTER"
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        <Layer />
      </VectorGoogleMap>,
    );
    expect(constructor.mock.calls[0][1]).toMatchObject({ renderingType: 'RASTER', styles });
    expect(screen.getByText('Map 1')).toBeInTheDocument();
    instance.setCenter({ lat: 23, lng: 89 });
    instance.setZoom(17.25);
    rerender(
      <VectorGoogleMap
        options={options}
        renderingType="VECTOR"
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        <Layer />
      </VectorGoogleMap>,
    );
    expect(screen.getByText('Map 2')).toBeInTheDocument();
    expect(constructor.mock.calls[1][1]).toMatchObject({
      renderingType: 'VECTOR',
      center: { lat: 23, lng: 89 },
      zoom: 17.25,
    });
    expect(constructor.mock.calls[1][1]).not.toHaveProperty('styles');
    expect(onUnmount).toHaveBeenCalledWith(instance);
    expect(removers.slice(0, 3).every((remove) => remove.mock.calls.length === 1)).toBe(true);
    rerender(
      <VectorGoogleMap
        options={options}
        renderingType="RASTER"
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        <Layer />
      </VectorGoogleMap>,
    );
    expect(screen.getByText('Map 3')).toBeInTheDocument();
    expect(constructor.mock.calls[2][1]).toMatchObject({
      renderingType: 'RASTER',
      styles,
      center: { lat: 23, lng: 89 },
      zoom: 17.25,
      tilt: 0,
      heading: 0,
    });
    expect(constructor).toHaveBeenCalledTimes(3);
    expect(onLoad).toHaveBeenCalledTimes(3);
    expect(onUnmount).toHaveBeenCalledTimes(2);
    expect(instances.every((map) => map.setRenderingType.mock.calls.length === 0)).toBe(true);
  });

  it('does not echo a native zoom gesture back into the camera', () => {
    const { instance, handlers } = setup();
    let nativeZoom = 12;
    instance.getZoom = () => nativeZoom;
    function MapWithZoomState() {
      const [zoom, setZoom] = useState(12);
      return <VectorGoogleMap zoom={zoom} onZoomChanged={() => setZoom(instance.getZoom())} />;
    }
    render(<MapWithZoomState />);
    for (let frame = 1; frame <= 60; frame++) {
      act(() => {
        nativeZoom = 12 + frame / 60;
        handlers.zoom_changed();
      });
    }
    expect(instance.setZoom).not.toHaveBeenCalled();
  });

  it('uses current event callbacks and removes its listeners when leaving', () => {
    const { instance, handlers, removers } = setup();
    const first = vi.fn();
    const next = vi.fn();
    const onIdle = vi.fn();
    const onZoomChanged = vi.fn();
    const onTilesLoaded = vi.fn();
    const onUnmount = vi.fn();
    const { rerender, unmount } = render(
      <VectorGoogleMap
        onClick={first}
        onIdle={onIdle}
        onZoomChanged={onZoomChanged}
        onTilesLoaded={onTilesLoaded}
        onUnmount={onUnmount}
      />,
    );
    const event = { latLng: { lat: 22, lng: 88 } };
    act(() => handlers.click(event));
    expect(first).toHaveBeenCalledWith(event);
    rerender(
      <VectorGoogleMap
        onClick={next}
        onIdle={onIdle}
        onZoomChanged={onZoomChanged}
        onTilesLoaded={onTilesLoaded}
        onUnmount={onUnmount}
      />,
    );
    act(() => {
      handlers.click(event);
      handlers.idle();
      handlers.zoom_changed();
      handlers.tilesloaded();
    });
    expect(first).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith(event);
    expect(onIdle).toHaveBeenCalledOnce();
    expect(onZoomChanged).toHaveBeenCalledOnce();
    expect(onTilesLoaded).toHaveBeenCalledOnce();
    unmount();
    expect(removers.every((remove) => remove.mock.calls.length === 1)).toBe(true);
    expect(onUnmount).toHaveBeenCalledWith(instance);
  });
});
