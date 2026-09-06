/**
 * Pure comparison logic for the Model Comparison page (rule 21): how a
 * vehicle's mileage compares to its model's average, and the resulting
 * health status/color.
 */

export const BAR_COLORS = [
  '#3B82F6',
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
  '#F59E0B',
  '#10B981',
  '#06B6D4',
  '#EF4444',
  '#F97316',
  '#84CC16',
];

export const STATUS_COLORS = {
  Healthy: '#10B981',
  Watch: '#F59E0B',
  Poor: '#EF4444',
};

export function getVariancePercent(vehicleAvg, modelAvg) {
  if (!modelAvg) return 0;
  return ((vehicleAvg - modelAvg) / modelAvg) * 100;
}

export function getPerformanceStatus(vp) {
  if (vp >= -5) return 'Healthy';
  if (vp >= -10) return 'Watch';
  return 'Poor';
}

export function getPerformanceColor(status) {
  return STATUS_COLORS[status] ?? '#6B7280';
}

// One row per model's vehicles, ranked by mileage, tagged with variance/status/color.
export function buildVehicleChartData(selectedModelData) {
  return (selectedModelData?.vehicles ?? [])
    .map((v) => {
      const rawVp = getVariancePercent(v.avgMileage, selectedModelData.avgMileage);
      const vp = Math.round(rawVp * 10) / 10;
      const status = getPerformanceStatus(vp);
      return {
        ...v,
        modelAvgMileage: selectedModelData.avgMileage,
        variancePct: vp,
        status,
        color: getPerformanceColor(status),
      };
    })
    .sort((a, b) => b.avgMileage - a.avgMileage);
}

// Default vehicle selection for a newly-picked model: the top 3 and bottom 3
// performers (already sorted by avgMileage descending), deduped.
export function defaultVehicleSelection(vehicleChartData) {
  const top3 = vehicleChartData.slice(0, 3);
  const bottom3 = vehicleChartData
    .slice(-3)
    .filter((v) => !top3.some((t) => t.vehicleNumber === v.vehicleNumber));
  return [...top3, ...bottom3].map((v) => v.vehicleNumber);
}

// At-risk count for a model: vehicles more than 5% below the model average.
export function countAtRisk(vehicles, modelAvg) {
  return (vehicles ?? []).filter((v) => getVariancePercent(v.avgMileage, modelAvg) < -5).length;
}
