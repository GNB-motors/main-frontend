import { describe, it, expect } from 'vitest';
import {
  NOVA_STATUS,
  haversineKm,
  bearingDegrees,
  formatAgoText,
  formatHrsText,
  resolveVehicleStatus,
  computeMapVehicles,
  createVehicleMarkerIcon,
} from './liveTracking.shared.js';

describe('Nova Edge Pro Live Tracking Helpers', () => {
  it('correctly resolves vehicle statuses', () => {
    expect(resolveVehicleStatus({ speed: 45, ignition: true })).toBe('Moving');
    expect(resolveVehicleStatus({ speed: 0, ignition: 'ON' })).toBe('Idling');
    expect(resolveVehicleStatus({ speed: 0, ignition: false })).toBe('Stopped');
    expect(resolveVehicleStatus({ isStale: true })).toBe('Offline');
    expect(resolveVehicleStatus({ state: 'OFFLINE' })).toBe('Offline');
  });

  it('computes haversine distance between two coordinates', () => {
    // Kolkata → Howrah, ~10 km apart.
    const dist = haversineKm([22.5726, 88.3639], [22.5958, 88.2636]);
    expect(dist).toBeGreaterThan(5);
    expect(dist).toBeLessThan(20);
  });

  it('computes compass bearing between points', () => {
    const p1 = [22.0, 88.0];
    const p2 = [23.0, 88.0]; // directly north
    const brg = bearingDegrees(p1, p2);
    expect(Math.round(brg)).toBe(0);
  });

  it('formats time ago strings appropriately', () => {
    expect(formatAgoText(0)).toBe('just now');
    expect(formatAgoText(15)).toBe('15 min ago');
    expect(formatAgoText(120)).toBe('2 hr ago');
    expect(formatAgoText(2880)).toBe('2 days ago');
    expect(formatAgoText(null)).toBe('—');
  });

  it('formats hours and minutes text', () => {
    expect(formatHrsText(95)).toBe('1h 35m');
    expect(formatHrsText(45)).toBe('0h 45m');
    expect(formatHrsText(0)).toBe('0h 00m');
  });

  it('exposes the status color palette', () => {
    expect(NOVA_STATUS.moving.c).toBe('#187A32');
    expect(NOVA_STATUS.stopped.c).toBe('#6A43D8');
    expect(NOVA_STATUS.idling.c).toBe('#C56200');
    expect(NOVA_STATUS.offline.c).toBe('#5D5D5E');
  });

  describe('computeMapVehicles — selected vehicle icon persistence across tabs', () => {
    const vMoving = {
      id: 'v1',
      plate: 'WB25R9540',
      status: 'moving',
      hasFix: true,
      lat: 22.5,
      lng: 88.3,
    };
    const vStopped = {
      id: 'v2',
      plate: 'WB11A1234',
      status: 'stopped',
      hasFix: true,
      lat: 22.6,
      lng: 88.4,
    };

    it('returns filteredVehicles when no vehicle is selected', () => {
      expect(computeMapVehicles([vStopped], null)).toEqual([vStopped]);
    });

    it('returns filteredVehicles as-is when selected vehicle is already in filtered list', () => {
      expect(computeMapVehicles([vStopped], vStopped)).toEqual([vStopped]);
    });

    it('retains selected moving vehicle on map when user switches to stopped tab', () => {
      // User selected vMoving, then switched tab to "Stopped" (filteredVehicles = [vStopped])
      const result = computeMapVehicles([vStopped], vMoving);
      expect(result).toHaveLength(2);
      expect(result.some((v) => v.id === 'v1')).toBe(true);
      expect(result.some((v) => v.id === 'v2')).toBe(true);
    });

    it('does not add selected vehicle if it has no GPS coordinates fix', () => {
      const vNoFix = {
        id: 'v3',
        plate: 'WB99X9999',
        status: 'offline',
        hasFix: false,
        lat: null,
        lng: null,
      };
      expect(computeMapVehicles([vStopped], vNoFix)).toEqual([vStopped]);
    });
  });

  describe('createVehicleMarkerIcon — authentic flashlight truck marker', () => {
    it('generates SVG data URL containing flashlight conical beam and status colors', () => {
      const icon = createVehicleMarkerIcon({
        status: 'moving',
        courseDegrees: 90,
        plate: 'WB25R9540',
        isSelected: false,
      });

      expect(icon).toBeDefined();
      expect(icon.url).toContain('data:image/svg+xml;charset=UTF-8,');
      const decodedSvg = decodeURIComponent(
        icon.url.replace('data:image/svg+xml;charset=UTF-8,', ''),
      );
      // Verify forward flashlight conical beam path
      expect(decodedSvg).toContain('M53.1321 14.2725');
      // Verify rotation to course degrees (90 deg)
      expect(decodedSvg).toContain('rotate(90, 48, 48)');
      // Verify moving green color
      expect(decodedSvg).toContain('#0C9F41');
    });

    it('supports (v, isSelected, showLabel) signature and colors by status', () => {
      const vStopped = { status: 'stopped', courseDegrees: 270, plate: 'WB11A1234' };
      const icon = createVehicleMarkerIcon(vStopped, true, true);
      const decoded = decodeURIComponent(icon.url.replace('data:image/svg+xml;charset=UTF-8,', ''));
      expect(decoded).toContain('#9333EA'); // stopped purple
      expect(decoded).toContain('rotate(270, 48, 48)');
      expect(decoded).toContain('WB11A1234'); // plate chip
    });

    it('distinctly distinguishes idling (orange #F97316) and offline (grey #9CA3AF)', () => {
      const vIdling = { status: 'idling', courseDegrees: 180, plate: 'WB25R1234' };
      const iconIdling = createVehicleMarkerIcon(vIdling, false, false);
      const decodedIdling = decodeURIComponent(
        iconIdling.url.replace('data:image/svg+xml;charset=UTF-8,', ''),
      );
      expect(decodedIdling).toContain('#F97316'); // orangish shade from status bar
      expect(decodedIdling).not.toContain('#9CA3AF');

      const vOffline = { status: 'offline', courseDegrees: 0, plate: 'WB25R5678' };
      const iconOffline = createVehicleMarkerIcon(vOffline, false, false);
      const decodedOffline = decodeURIComponent(
        iconOffline.url.replace('data:image/svg+xml;charset=UTF-8,', ''),
      );
      expect(decodedOffline).toContain('#9CA3AF'); // clean grey from status bar
      expect(decodedOffline).not.toContain('#F97316');
    });

    it('scales vehicle marker icon and label relatively with map zoom', () => {
      // Mock window.google.maps.Size and Point if needed
      window.google = {
        maps: {
          Size: class {
            constructor(w, h) {
              this.width = w;
              this.height = h;
            }
          },
          Point: class {
            constructor(x, y) {
              this.x = x;
              this.y = y;
            }
          },
        },
      };

      const veh = { status: 'moving', plate: 'WB19A1234' };

      // Zoom 16 (scale 1.50): scaledW = 60 * 1.50 = 90
      const iconClose = createVehicleMarkerIcon(veh, false, true, 16);
      expect(iconClose.scaledSize.width).toBe(90);

      // Zoom 14 (scale 1.30): scaledW = 60 * 1.30 = 78
      const iconNormal = createVehicleMarkerIcon(veh, false, true, 14);
      expect(iconNormal.scaledSize.width).toBe(78);

      // Zoom 10 (scale 0.96): scaledW = round(60 * 0.96) = 58
      const iconRegional = createVehicleMarkerIcon(veh, false, true, 10);
      expect(iconRegional.scaledSize.width).toBe(58);

      // Zoom 5 (scale 0.64): scaledW = round(60 * 0.64) = 38
      const iconNational = createVehicleMarkerIcon(veh, false, true, 5);
      expect(iconNational.scaledSize.width).toBe(38);

      // Verify strictly monotonic growth as user zooms in
      expect(iconClose.scaledSize.width).toBeGreaterThan(iconNormal.scaledSize.width);
      expect(iconNormal.scaledSize.width).toBeGreaterThan(iconRegional.scaledSize.width);
      expect(iconRegional.scaledSize.width).toBeGreaterThan(iconNational.scaledSize.width);

      // Clutter prevention: unselected vehicles at low zoom omit labels, while close-up or selected show them
      const iconCloseDecoded = decodeURIComponent(iconClose.url);
      expect(iconCloseDecoded).toContain('WB19A1234');
      const iconNationalDecoded = decodeURIComponent(iconNational.url);
      expect(iconNationalDecoded).not.toContain('WB19A1234');
      const iconSelectedNational = createVehicleMarkerIcon(
        { ...veh, isSelected: true },
        true,
        true,
        5,
      );
      expect(decodeURIComponent(iconSelectedNational.url)).toContain('WB19A1234');
    });
  });
});
