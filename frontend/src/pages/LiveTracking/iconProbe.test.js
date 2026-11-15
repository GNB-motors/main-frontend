import { describe, it, expect } from 'vitest';
import {
  BadgeCheck,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Cross,
  Factory,
  Fuel,
  Landmark,
  ParkingSquare,
  RotateCw,
  Search,
  Shield,
  TrafficCone,
  UtensilsCrossed,
  Wrench,
  X,
} from 'lucide-react';

/**
 * The redesign leans on a handful of lucide icons. A lucide upgrade that
 * renames or drops one of them would break a screen at import time with
 * "Element type is invalid" — a confusing way to find out. This test fails
 * at build time instead.
 */
describe('lucide icons the redesign depends on', () => {
  const icons = {
    BadgeCheck,
    CalendarClock,
    ChevronDown,
    ChevronUp,
    Cross,
    Factory,
    Fuel,
    Landmark,
    ParkingSquare,
    RotateCw,
    Search,
    Shield,
    TrafficCone,
    UtensilsCrossed,
    Wrench,
    X,
  };

  it.each(Object.keys(icons))('exports %s', (name) => {
    expect(icons[name]).toBeDefined();
  });
});
