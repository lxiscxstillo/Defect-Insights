import type { NumericalStats, FrequencyDistribution } from '@/types';

export function calculateMean(data: number[]): number {
  if (data.length === 0) return 0;
  return data.reduce((acc, val) => acc + val, 0) / data.length;
}

export function calculateMedian(data: number[]): number {
  if (data.length === 0) return 0;
  const sortedData = [...data].sort((a, b) => a - b);
  const mid = Math.floor(sortedData.length / 2);
  return sortedData.length % 2 !== 0 ? sortedData[mid] : (sortedData[mid - 1] + sortedData[mid]) / 2;
}

export function calculateMode(data: (string | number)[]): (string | number)[] | string | number | null {
  if (data.length === 0) return null;
  const frequency: Record<string | number, number> = {};
  let maxFreq = 0;
  data.forEach(item => {
    frequency[item] = (frequency[item] || 0) + 1;
    if (frequency[item] > maxFreq) {
      maxFreq = frequency[item];
    }
  });

  const modes = Object.keys(frequency).filter(key => frequency[key] === maxFreq);
  if (modes.length === data.length) return null; // All values are unique or equally frequent
  if (modes.length === 1) return modes[0]; // Can be number or string, ensure type consistency if needed
  
  // Attempt to convert to number if possible
  return modes.map(m => (isNaN(Number(m)) ? m : Number(m)));
}


export function calculateVariance(data: number[]): number {
  if (data.length < 2) return 0;
  const mean = calculateMean(data);
  return data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (data.length -1); // Sample variance
}

export function calculateStdDev(data: number[]): number {
  if (data.length < 2) return 0;
  return Math.sqrt(calculateVariance(data));
}

export function calculateMinMaxRange(data: number[]): { min: number; max: number; range: number } {
  if (data.length === 0) return { min: 0, max: 0, range: 0 };
  const min = Math.min(...data);
  const max = Math.max(...data);
  return { min, max, range: max - min };
}

export function calculateQuartiles(data: number[]): { q1: number; q3: number; iqr: number } {
  if (data.length === 0) return { q1: 0, q3: 0, iqr: 0 };
  const sortedData = [...data].sort((a, b) => a - b);
  
  const quartile = (p: number): number => {
    const pos = (sortedData.length - 1) * p;
    const base = Math.floor(pos);
    const rest = pos - base;
    if (sortedData[base + 1] !== undefined) {
      return sortedData[base] + rest * (sortedData[base + 1] - sortedData[base]);
    } else {
      return sortedData[base];
    }
  };

  const q1 = quartile(0.25);
  const q3 = quartile(0.75);
  return { q1, q3, iqr: q3 - q1 };
}

export function calculateDescriptiveStats(data: number[]): NumericalStats | null {
  if (data.length === 0) return null;
  const minMax = calculateMinMaxRange(data);
  const quartiles = calculateQuartiles(data);
  return {
    mean: calculateMean(data),
    median: calculateMedian(data),
    mode: calculateMode(data),
    stdDev: calculateStdDev(data),
    variance: calculateVariance(data),
    min: minMax.min,
    max: minMax.max,
    range: minMax.range,
    q1: quartiles.q1,
    q3: quartiles.q3,
    iqr: quartiles.iqr,
  };
}

export function calculateFrequencyDistribution<T extends string | number>(data: T[]): FrequencyDistribution {
  const distribution: FrequencyDistribution = {};
  data.forEach(item => {
    distribution[item] = (distribution[item] || 0) + 1;
  });
  return distribution;
}

export function createHistogramData(data: number[], numBins: number = 10): { bin: string; count: number }[] {
  if (data.length === 0) return [];
  const min = Math.min(...data);
  const max = Math.max(...data);

  if (min === max) { // All values are the same
     // Create a single bin representing this value
     return [{ bin: `${min.toFixed(2)}`, count: data.length }];
  }
  
  const binSize = (max - min) / numBins;
  // Adjust numBins if binSize is 0 (can happen if max is very close to min)
  if (binSize === 0) {
    // Handle this case, perhaps by creating fewer bins or a single bin
    return [{ bin: `${min.toFixed(2)} - ${max.toFixed(2)}`, count: data.length }];
  }
  
  const bins = Array(numBins).fill(null).map((_, i) => {
    const lowerBound = min + i * binSize;
    const upperBound = min + (i + 1) * binSize;
    return {
      name: `${lowerBound.toFixed(2)}-${upperBound.toFixed(2)}`,
      count: 0,
      lowerBound,
      upperBound,
    };
  });

  data.forEach(value => {
    let binIndex = Math.floor((value - min) / binSize);
    // Ensure value falls into a valid bin, especially the max value
    if (value === max) {
      binIndex = numBins - 1; // Max value goes into the last bin
    } else if (binIndex >= numBins) {
      binIndex = numBins - 1; // Values slightly over due to precision issues
    } else if (binIndex < 0) {
      binIndex = 0; // Values slightly under due to precision issues
    }
    
    if (bins[binIndex]) {
      bins[binIndex].count++;
    }
  });
  return bins.map(b => ({ bin: b.name, count: b.count }));
}
