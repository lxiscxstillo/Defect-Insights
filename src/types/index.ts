export interface DefectRecord {
  id: string;
  defect_type: string;
  severity: string;
  defect_location: string;
  inspection_method: string;
  repair_cost: number;
}

export interface FrequencyDistribution {
  [key: string]: number;
}

export interface NumericalStats {
  mean: number;
  median: number;
  mode: (string | number)[] | string | number | null;
  stdDev: number;
  variance: number;
  min: number;
  max: number;
  range: number;
  q1: number;
  q3: number;
  iqr: number;
}

export interface MonteCarloResult {
  scenario: string; // e.g., "0% Reduction", "10% Reduction"
  totalCosts: number[]; // Array of 10,000 simulated total costs
  meanCost: number;
  stdDevCost: number;
  percentiles: {
    p5: number;
    p50: number; // Median
    p95: number;
  };
  expectedSavings?: number; // Compared to baseline (0% reduction)
}
