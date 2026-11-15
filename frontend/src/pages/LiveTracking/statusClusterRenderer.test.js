import { describe, expect, it } from 'vitest';
import { statusClusterSvg } from './statusClusterRenderer';
describe('cluster status ring', () => {
  it('shows segments in proportion to the trucks in the cluster', () => {
    const svg = statusClusterSvg([{ fleetStatus: 'moving' }, { fleetStatus: 'moving' }, { fleetStatus: 'stopped' }, { fleetStatus: 'offline' }]);
    expect(svg).toContain('stroke="#0C9F41"');
    expect(svg).toContain('stroke-dasharray="50 50"');
    expect(svg).toContain('stroke="#9333EA"');
    expect(svg).toContain('stroke="#9CA3AF"');
    expect(svg).not.toContain('stroke="#F97316"');
  });
});
