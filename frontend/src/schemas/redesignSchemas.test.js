import { describe, it, expect } from 'vitest';
import vehicleNow from '@/test/fixtures/redesign/vehicleNow.json';
import whereNext from '@/test/fixtures/redesign/whereNext.json';
import intelligenceSummary from '@/test/fixtures/redesign/intelligenceSummary.json';
import intelligenceIssues from '@/test/fixtures/redesign/intelligenceIssues.json';
import reportCards from '@/test/fixtures/redesign/reportCards.json';
import instances from '@/test/fixtures/redesign/instances.json';
import track from '@/test/fixtures/redesign/track.json';
import mapPlaces from '@/test/fixtures/redesign/mapPlaces.json';
import campuses from '@/test/fixtures/redesign/campuses.json';
import nearbyHelp from '@/test/fixtures/redesign/nearbyHelp.json';
import tripsHistory from '@/test/fixtures/redesign/tripsHistory.json';
import placeQuestions from '@/test/fixtures/redesign/placeQuestions.json';
import mileage from '@/test/fixtures/redesign/mileage.json';
import digest from '@/test/fixtures/redesign/digest.json';
import accounts from '@/test/fixtures/redesign/accounts.json';

import { VehicleNowResponseSchema } from './fleetView.schema.js';
import { WhereNextResponseSchema } from './fleetView.schema.js';
import {
  IntelligenceIssuesResponseSchema,
  IntelligenceSummaryResponseSchema,
  InstancesResponseSchema,
  ReportCardsResponseSchema,
} from './intelligence.schema.js';
import { TrackResponseSchema } from './track.schema.js';
import {
  CampusesResponseSchema,
  MapPlacesResponseSchema,
  NearbyHelpResponseSchema,
} from './mapPlaces.schema.js';
import { PlaceQuestionsResponseSchema, TripsHistoryResponseSchema } from './tripsHistory.schema.js';
import { MileageResponseSchema } from './mileageV2.schema.js';
import { DigestResponseSchema } from './digestV2.schema.js';
import { AccountsLinkStateResponseSchema } from './accounts.schema.js';

describe('redesign schemas', () => {
  const cases = [
    ['vehicle now', VehicleNowResponseSchema, vehicleNow],
    ['where next', WhereNextResponseSchema, whereNext],
    ['intelligence summary', IntelligenceSummaryResponseSchema, intelligenceSummary],
    ['intelligence issues', IntelligenceIssuesResponseSchema, intelligenceIssues],
    ['report cards', ReportCardsResponseSchema, reportCards],
    ['instances', InstancesResponseSchema, instances],
    ['track', TrackResponseSchema, track],
    ['map places', MapPlacesResponseSchema, mapPlaces],
    ['campuses', CampusesResponseSchema, campuses],
    ['nearby help', NearbyHelpResponseSchema, nearbyHelp],
    ['trips history', TripsHistoryResponseSchema, tripsHistory],
    ['place questions', PlaceQuestionsResponseSchema, placeQuestions],
    ['mileage', MileageResponseSchema, mileage],
    ['digest', DigestResponseSchema, digest],
    ['accounts link state', AccountsLinkStateResponseSchema, accounts],
  ];

  it.each(cases)('parses the %s fixture', (_name, schema, fixture) => {
    expect(() => schema.parse(fixture)).not.toThrow();
  });

  it.each(cases)('accepts a held response for %s', (_name, schema) => {
    const held = { held: true, why: { text: 'Still being checked.', basis: '122 of 196 rows' } };
    expect(() => schema.parse(held)).not.toThrow();
  });

  it('keeps unknown values null instead of turning them into 0', () => {
    const parsed = VehicleNowResponseSchema.parse({
      ...vehicleNow,
      readings: { ...vehicleNow.readings, odometerKm: null },
    });
    expect(parsed.readings.odometerKm).toBeNull();
  });

  it('accepts extra fields the backend may add', () => {
    const parsed = VehicleNowResponseSchema.parse({ ...vehicleNow, somethingNew: 'ignored' });
    expect(parsed.registrationNumber).toBe('WB11L8862');
  });
});
