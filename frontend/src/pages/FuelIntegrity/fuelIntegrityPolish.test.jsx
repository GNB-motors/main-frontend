import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { normalisePumpLedger } from './pumpHonestyModel';
import PumpsWatchCard from './PumpsWatchCard';
import RefuelAdvisoryCard from './RefuelAdvisoryCard';
import MassBalancePipeline from './integrity/MassBalancePipeline';
import { useApi } from '../../hooks/useApi';
import { useFeatureFlags } from '../../contexts/FeatureFlagsContext.jsx';

vi.mock('../../hooks/useApi', () => ({ useApi: vi.fn(), default: vi.fn() }));
vi.mock('../../contexts/FeatureFlagsContext.jsx', () => ({ useFeatureFlags: vi.fn() }));

/**
 * The Fuel Integrity screens were written in a console voice: SHOUTING status
 * codes, a monospace strip for a sentence, and zeroes that read like findings.
 * This file is the guard that keeps them human.
 */

const here = path.dirname(fileURLToPath(import.meta.url));
const css = readFileSync(path.join(here, 'FuelIntegrity.css'), 'utf8');
const cssRules = css.split('}');

const ruleHas = (selector, pattern) =>
  cssRules.some((rule) => rule.includes(selector) && pattern.test(rule));

describe('Fuel Integrity cards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useFeatureFlags.mockReturnValue({ ready: true, isEnabled: () => true });
  });

  it('says the status in words, not in codes', () => {
    useApi.mockReturnValue({
      data: {
        advisories: [
          {
            _id: 'a1',
            registrationNumber: 'WB11L8862',
            status: 'REFUEL_SOON',
            pctFull: 22,
            currentFuelL: 44,
            estimatedRangeKm: 180,
            avgEfficiencyKmpl: 4.1,
            tankCapacityL: 200,
            litresToFull: 78,
            estimatedFillCostInr: 3900,
          },
          {
            _id: 'a2',
            registrationNumber: 'WB11L8863',
            status: 'CRITICAL',
            pctFull: 8,
            currentFuelL: 16,
            estimatedRangeKm: 60,
            avgEfficiencyKmpl: 4,
            tankCapacityL: 200,
            litresToFull: 184,
            estimatedFillCostInr: 9200,
          },
        ],
        summary: { CRITICAL: 1, REFUEL_SOON: 1 },
      },
      loading: false,
      error: null,
    });

    render(
      <MemoryRouter>
        <RefuelAdvisoryCard />
      </MemoryRouter>,
    );

    expect(screen.getByText('Refuel soon')).toBeInTheDocument();
    expect(screen.getByText('Critical')).toBeInTheDocument();
    expect(screen.queryByText('REFUEL_SOON')).not.toBeInTheDocument();
    expect(screen.queryByText('CRITICAL')).not.toBeInTheDocument();
  });

  it('drops the pump numbers when no pump has been audited', () => {
    render(<PumpsWatchCard ledger={{ data: normalisePumpLedger({ pumps: [] }) }} />);
    expect(screen.getByText(/No pump fills audited yet/)).toBeInTheDocument();
    expect(screen.queryByText(/pumps ·/)).not.toBeInTheDocument();
  });

  it('names the pump status in words when there is one', () => {
    const ledger = {
      data: normalisePumpLedger({
        pumps: [
          {
            pump: 'Dankuni pump',
            fills: 4,
            claimedLitres: 1200,
            actualLitres: 1000,
            shortfallLitres: 200,
            shortfallPct: 16.7,
            estimatedLossInr: 19000,
          },
        ],
      }),
    };
    render(<PumpsWatchCard ledger={ledger} />);
    expect(screen.getByText('Chronic shortage')).toBeInTheDocument();
    expect(screen.queryByText('CHRONIC_SHORTAGE')).not.toBeInTheDocument();
    expect(screen.getByText('1 pumps · 1 chronic')).toBeInTheDocument();
  });
});

describe('Fuel Integrity mass balance strip', () => {
  it('names the first step in the words a person would use', () => {
    render(
      <MassBalancePipeline
        lossL={12}
        pricePerL={95}
        totalEngineBurnL={640}
        totalFillsLitres={690}
        totalNetTankDeltaL={10}
        windowDays={22}
      />,
    );
    expect(screen.getByText('1. Fuel in (tank sensor)')).toBeInTheDocument();
    expect(
      screen.getByText(/Fuel in, engine burn and tank change side by side/),
    ).toBeInTheDocument();
  });

  it('keeps the chips and the step labels in sentence case', () => {
    expect(ruleHas('.fi-bento-pill', /text-transform\s*:\s*uppercase/i)).toBe(false);
    expect(ruleHas('.fi-status-badge', /text-transform\s*:\s*uppercase/i)).toBe(false);
    expect(ruleHas('.fi-step-label', /text-transform\s*:\s*uppercase/i)).toBe(false);
  });

  it('does not print a sentence in a monospace strip', () => {
    expect(ruleHas('.fi-pipeline-formula', /font-family\s*:\s*('SF Mono'|monospace)/i)).toBe(false);
  });
});
