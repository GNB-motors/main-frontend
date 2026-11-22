import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { useGoogleMap } from '@react-google-maps/api';
import VectorGoogleMap from './VectorGoogleMap';

afterEach(() => vi.unstubAllGlobals());

function setup() {
  const handlers = {};
  const removers = [];
  const instance = {
    setOptions: vi.fn((options) => {
      if ('renderingType' in options)
        throw new Error('renderingType cannot change after instantiation');
    }),
    setCenter: vi.fn(),
    setZoom: vi.fn(),
    addListener: vi.fn((name, handler) => {
      handlers[name] = handler;
      const remove = vi.fn();
      removers.push(remove);
      return { remove };
    }),
  };
  const constructor = vi.fn(function () {
    return instance;
  });
  vi.stubGlobal('google', { maps: { Map: constructor } });
  return { instance, constructor, handlers, removers };
}

describe('vector map lifecycle', () => {
  it('sets renderingType only at creation and keeps the same map through replay and style changes', () => {
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
      renderingType: 'VECTOR',
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

  it('uses current event callbacks and removes its listeners when leaving', () => {
    const { instance, handlers, removers } = setup();
    const first = vi.fn();
    const next = vi.fn();
    const onIdle = vi.fn();
    const onZoomChanged = vi.fn();
    const onUnmount = vi.fn();
    const { rerender, unmount } = render(
      <VectorGoogleMap
        onClick={first}
        onIdle={onIdle}
        onZoomChanged={onZoomChanged}
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
        onUnmount={onUnmount}
      />,
    );
    act(() => {
      handlers.click(event);
      handlers.idle();
      handlers.zoom_changed();
    });
    expect(first).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith(event);
    expect(onIdle).toHaveBeenCalledOnce();
    expect(onZoomChanged).toHaveBeenCalledOnce();
    unmount();
    expect(removers.every((remove) => remove.mock.calls.length === 1)).toBe(true);
    expect(onUnmount).toHaveBeenCalledWith(instance);
  });
});
